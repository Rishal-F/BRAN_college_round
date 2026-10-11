
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

# Allow imports from the project root and backend folder.
PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Member 1's PDF reader and research extractor.
from extraction.pdf_reader import ScannedPDFError, extract_pdf_pages
from extraction.llm_extractor import (
    ExtractionError,
    ResearchDetails,
    _load_demo_details,
    extract_research_details,
)

# Member 2's runner and Member 4's audit logic.
try:
    from backend.audit import compare_results
    from backend.runner import execute_experiment
except ModuleNotFoundError:
    from audit import compare_results
    from runner import execute_experiment


app = FastAPI(title="CrisisGrid API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _format_extraction_for_frontend(details: ResearchDetails, filename: str) -> dict:
    """Format ResearchDetails into a unified response for both API and React UI."""
    dump = details.model_dump(mode="json")
    title = Path(filename).stem.replace("_", " ").replace("-", " ").title()

    confirmed_details = []
    missing_or_ambiguous = []
    reported_metrics = []
    evidence_snippets = []

    category_labels = {
        "model_or_algorithm": "Model Architecture",
        "dataset": "Dataset & Benchmark",
        "methodology": "Methodology",
        "hyperparameters_and_experimental_configuration": "Hyperparameters",
        "evaluation_metrics": "Evaluation Metrics",
        "published_or_reported_results": "Reported Benchmark Claims",
    }

    import re

    for cat_key, cat_name in category_labels.items():
        cat_data = dump.get(cat_key, {})
        status = cat_data.get("status", "missing")
        claims = cat_data.get("claims", [])

        if status == "missing" or not claims:
            missing_or_ambiguous.append({
                "field": cat_name,
                "detail": f"Not reported or omitted in paper text ({cat_name}).",
                "severity": "high" if cat_key == "published_or_reported_results" else "medium",
            })
        else:
            for claim in claims:
                val = claim.get("value")
                page_nums = claim.get("page_numbers", [])
                page_str = (
                    f"Page {', '.join(str(p) for p in page_nums)}"
                    if page_nums
                    else "Cited"
                )
                claim_status = claim.get("status", "reported")

                if claim_status in {"reported", "uncertain"}:
                    confirmed_details.append({
                        "field": cat_name,
                        "value": str(val) if val else "Implementation detail reported in paper",
                        "page": page_str,
                    })

                    if claim.get("evidence"):
                        evidence_snippets.append({
                            "page": page_nums[0] if page_nums else 1,
                            "section": cat_name,
                            "text": claim["evidence"],
                        })

                    # Extract percentage or ratio values for metrics
                    if cat_key in {"published_or_reported_results", "evaluation_metrics"} and val:
                        val_str = str(val)
                        pct_matches = re.findall(r"(\d+(?:\.\d+)?)\s*%", val_str)
                        if pct_matches:
                            try:
                                ratio = float(pct_matches[0]) / 100.0
                                if 0 <= ratio <= 1:
                                    reported_metrics.append({
                                        "name": f"{cat_name} Accuracy",
                                        "reported_value": round(ratio, 4),
                                        "unit": "ratio",
                                        "page": page_str,
                                    })
                            except ValueError:
                                pass
                        else:
                            dec_matches = re.findall(r"\b(0\.\d+)\b", val_str)
                            if dec_matches:
                                try:
                                    ratio = float(dec_matches[0])
                                    reported_metrics.append({
                                        "name": f"{cat_name} Accuracy",
                                        "reported_value": round(ratio, 4),
                                        "unit": "ratio",
                                        "page": page_str,
                                    })
                                except ValueError:
                                    pass

    return {
        **dump,
        "status": "success",
        "title": title,
        "confirmed_details": confirmed_details,
        "missing_or_ambiguous_details": missing_or_ambiguous,
        "reported_metrics": reported_metrics,
        "evidence_snippets": evidence_snippets,
        "raw_extraction": dump,
    }


@app.get("/")
def home():
    return {"message": "Welcome to CrisisGrid API"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract")
async def extract(file: UploadFile = File(...), demo: bool = False):
    # Check that the uploaded filename ends in .pdf.
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    # Read the uploaded file.
    pdf_bytes = await file.read()

    # Check the PDF file signature.
    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file."
        )

    # If demo mode is explicitly requested, return the validated fixture
    if demo:
        demo_details = _load_demo_details()
        return _format_extraction_for_frontend(demo_details, file.filename)

    temporary_path = None

    try:
        # Save the uploaded PDF to a temporary file.
        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False
        ) as temporary_file:
            temporary_file.write(pdf_bytes)
            temporary_path = Path(temporary_file.name)

        # Member 1: Read the PDF pages.
        pages = await run_in_threadpool(
            extract_pdf_pages,
            temporary_path
        )

        # Member 1: Extract research details using Ollama.
        details = await run_in_threadpool(
            extract_research_details,
            pages
        )

        # Return unified extracted information for API and frontend.
        return _format_extraction_for_frontend(details, file.filename)

    except ScannedPDFError as error:
        raise HTTPException(
            status_code=422,
            detail=(
                "The uploaded PDF contains no extractable text. It appears to be "
                "scanned or image-only. CrisisGrid requires text-selectable research PDFs."
            ),
        ) from error

    except ExtractionError as error:
        error_msg = str(error)
        print(f"Extraction error: {error_msg}", flush=True)

        if "timed out" in error_msg.lower():
            raise HTTPException(
                status_code=504,
                detail=(
                    "Ollama request timed out while extracting paper details. "
                    "Try uploading a shorter PDF or increase OLLAMA_TIMEOUT_SECONDS."
                ),
            ) from error

        if "could not connect to ollama" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail=(
                    "Could not connect to Ollama at http://localhost:11434. "
                    "Please ensure Ollama is running ('ollama serve')."
                ),
            ) from error

        if "http 404" in error_msg.lower():
            raise HTTPException(
                status_code=500,
                detail=(
                    "Ollama model 'qwen2.5:3b' was not found. "
                    "Please pull the model with 'ollama pull qwen2.5:3b'."
                ),
            ) from error

        raise HTTPException(
            status_code=500,
            detail=f"Research extraction failed: {type(error).__name__}"
        ) from error

    except Exception as error:
        print(f"Unexpected extraction error: {type(error).__name__}: {error}", flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Research extraction failed: {type(error).__name__}"
        ) from error

    finally:
        # Always remove the temporary PDF.
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)



class ExperimentRequest(BaseModel):
    dataset: str = "iris"
    model: str = "random_forest"
    hyperparameters: dict = Field(
        default_factory=lambda: {
            "n_estimators": 100,
            "max_depth": 5
        }
    )
    test_size: float = Field(default=0.2, gt=0, lt=1)
    random_seed: int = 42


@app.post("/run")
def run_experiment(request: ExperimentRequest):
    try:
        return execute_experiment(request.model_dump())
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


class AuditRequest(BaseModel):
    reported_accuracy: float = Field(ge=0, le=1)
    measured_accuracy: float = Field(ge=0, le=1)


@app.post("/audit")
def audit(request: AuditRequest):
    return compare_results(
        request.reported_accuracy,
        request.measured_accuracy
    )
