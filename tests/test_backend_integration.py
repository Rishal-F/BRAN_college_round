"""Comprehensive integration tests for CrisisGrid FastAPI backend endpoints and workflows."""

import io
from pathlib import Path
from unittest.mock import patch

import fitz  # PyMuPDF
import pytest
from fastapi import HTTPException, UploadFile

from backend.main import (
    AuditRequest,
    ExperimentRequest,
    audit,
    extract,
    health,
    home,
    run_experiment,
)
from extraction.llm_extractor import ExtractionError, _load_demo_details


def _create_test_pdf(text: str) -> bytes:
    """Create a minimal in-memory text-selectable PDF."""
    doc = fitz.open()
    page = doc.new_page()
    if text:
        page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _create_empty_pdf() -> bytes:
    """Create a PDF with no extractable text (simulating image-only or scanned)."""
    doc = fitz.open()
    page = doc.new_page()
    # Draw a rectangle without any text
    page.draw_rect(fitz.Rect(50, 50, 200, 200), color=(0, 0, 1), fill=(0.8, 0.8, 1))
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _make_upload_file(filename: str, content: bytes) -> UploadFile:
    """Helper to wrap bytes in a FastAPI UploadFile."""
    return UploadFile(filename=filename, file=io.BytesIO(content))


# ============================================================================
# Core API & Health Tests
# ============================================================================

def test_api_welcome_endpoint():
    """Verify GET / returns API welcome message."""
    response = home()
    assert response == {"message": "Welcome to CrisisGrid API"}


def test_health_check_endpoint():
    """Verify GET /health returns status ok."""
    response = health()
    assert response == {"status": "ok"}


# ============================================================================
# Audit Endpoint Tests (POST /audit)
# ============================================================================

def test_audit_within_tolerance():
    """Verify POST /audit reports tolerance match when |delta| <= 0.02."""
    req = AuditRequest(reported_accuracy=0.95, measured_accuracy=0.94)
    data = audit(req)
    assert data["status"] == "metric_within_tolerance"
    assert data["within_tolerance"] is True
    assert data["difference_percentage_points"] == 1.0


def test_audit_metric_discrepancy():
    """Verify POST /audit reports discrepancy when |delta| > 0.02."""
    req = AuditRequest(reported_accuracy=0.95, measured_accuracy=0.89)
    data = audit(req)
    assert data["status"] == "metric_discrepancy"
    assert data["within_tolerance"] is False
    assert data["difference_percentage_points"] == 6.0


def test_audit_validation_bounds():
    """Verify AuditRequest rejects accuracy outside [0.0, 1.0]."""
    with pytest.raises(Exception):
        AuditRequest(reported_accuracy=1.5, measured_accuracy=0.90)


# ============================================================================
# Experiment Runner Tests (POST /run) - Member 2 Integration
# ============================================================================

def test_run_experiment_default_iris():
    """Verify POST /run executes default Iris benchmark with Random Forest and MLflow."""
    req = ExperimentRequest()
    data = run_experiment(req)
    assert data["status"] == "success"
    assert data["dataset"] == "iris"
    assert data["model"] == "random_forest"
    assert "measured_accuracy" in data
    assert 0.8 <= data["measured_accuracy"] <= 1.0
    assert "mlflow_run_id" in data
    assert data["test_samples"] == 30


def test_run_experiment_svm_configuration():
    """Verify POST /run executes SVM model on Iris dataset."""
    req = ExperimentRequest(
        dataset="iris",
        model="svm",
        hyperparameters={"C": 1.0, "kernel": "linear"},
        test_size=0.25,
        random_seed=42,
    )
    data = run_experiment(req)
    assert data["status"] == "success"
    assert data["model"] == "svm"
    assert "measured_accuracy" in data
    assert 0.8 <= data["measured_accuracy"] <= 1.0


def test_run_experiment_invalid_model():
    """Verify POST /run raises HTTP 400 for unsupported model."""
    req = ExperimentRequest(dataset="iris", model="deep_net")
    with pytest.raises(HTTPException) as exc_info:
        run_experiment(req)
    assert exc_info.value.status_code == 400
    assert "Supported models" in exc_info.value.detail


# ============================================================================
# PDF Intake & Extraction Tests (POST /extract)
# ============================================================================

@pytest.mark.anyio
async def test_extract_rejects_non_pdf_file():
    """Verify POST /extract rejects non-PDF file extension."""
    upload = _make_upload_file("paper.txt", b"Plain text file")
    with pytest.raises(HTTPException) as exc_info:
        await extract(file=upload)
    assert exc_info.value.status_code == 400
    assert "Please upload a PDF file." in exc_info.value.detail


@pytest.mark.anyio
async def test_extract_rejects_corrupted_pdf_header():
    """Verify POST /extract rejects file without %PDF- magic bytes."""
    upload = _make_upload_file("paper.pdf", b"Not a PDF header")
    with pytest.raises(HTTPException) as exc_info:
        await extract(file=upload)
    assert exc_info.value.status_code == 400
    assert "Invalid PDF file." in exc_info.value.detail


@pytest.mark.anyio
async def test_extract_detects_scanned_image_only_pdf():
    """Verify POST /extract detects image-only PDF and returns HTTP 422."""
    pdf_bytes = _create_empty_pdf()
    upload = _make_upload_file("scanned_paper.pdf", pdf_bytes)
    with pytest.raises(HTTPException) as exc_info:
        await extract(file=upload)
    assert exc_info.value.status_code == 422
    assert "contains no extractable text" in exc_info.value.detail


@pytest.mark.anyio
async def test_extract_demo_fixture_mode():
    """Verify POST /extract with demo=true returns complete validated research fixture."""
    pdf_bytes = _create_test_pdf("Sample Paper Content")
    upload = _make_upload_file("sample_paper.pdf", pdf_bytes)
    data = await extract(file=upload, demo=True)
    assert data["status"] == "success"
    assert "title" in data
    assert "confirmed_details" in data
    assert "missing_or_ambiguous_details" in data
    assert "model_or_algorithm" in data


@pytest.mark.anyio
@patch("backend.main.extract_research_details")
async def test_extract_mocked_ollama_timeout(mock_extract):
    """Verify POST /extract handles Ollama timeout and returns HTTP 504."""
    mock_extract.side_effect = ExtractionError("The Ollama request timed out while processing page chunk [1, 2].")
    pdf_bytes = _create_test_pdf("Page text content")
    upload = _make_upload_file("timeout_paper.pdf", pdf_bytes)
    with pytest.raises(HTTPException) as exc_info:
        await extract(file=upload)
    assert exc_info.value.status_code == 504
    assert "timed out" in exc_info.value.detail.lower()


@pytest.mark.anyio
@patch("backend.main.extract_research_details")
async def test_extract_mocked_ollama_connection_failure(mock_extract):
    """Verify POST /extract handles Ollama connection failure and returns HTTP 503."""
    mock_extract.side_effect = ExtractionError("Could not connect to Ollama at http://localhost:11434.")
    pdf_bytes = _create_test_pdf("Page text content")
    upload = _make_upload_file("offline_paper.pdf", pdf_bytes)
    with pytest.raises(HTTPException) as exc_info:
        await extract(file=upload)
    assert exc_info.value.status_code == 503
    assert "Could not connect to Ollama" in exc_info.value.detail


@pytest.mark.anyio
@patch("backend.main.extract_research_details")
async def test_extract_success_with_claims_and_evidence(mock_extract):
    """Verify POST /extract maps claims into confirmed_details and reported_metrics."""
    mock_extract.return_value = _load_demo_details()
    pdf_bytes = _create_test_pdf("Evidence text on page 9")
    upload = _make_upload_file("sample_study.pdf", pdf_bytes)
    data = await extract(file=upload)
    assert data["status"] == "success"
    assert data["title"] == "Sample Study"
    assert len(data["confirmed_details"]) > 0
    assert len(data["evidence_snippets"]) > 0
