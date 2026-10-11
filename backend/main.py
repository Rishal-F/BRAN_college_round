
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
from extraction.pdf_reader import extract_pdf_pages
from extraction.llm_extractor import extract_research_details

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
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Welcome to CrisisGrid API"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
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

        # Return the extracted information as JSON.
        return details.model_dump(mode="json")

    except Exception as error:
        # Print the extraction error in the backend terminal.
        print(
            f"Extraction error: {type(error).__name__}: {error}",
            flush=True
        )

        # Print Ollama's detailed HTTP error, if available.
        cause = error.__cause__

        if cause is not None and hasattr(cause, "read"):
            try:
                print(
                    "Ollama error details:",
                    cause.read().decode("utf-8"),
                    flush=True
                )
            except Exception:
                pass

        # Return a safe error message to the frontend.
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
