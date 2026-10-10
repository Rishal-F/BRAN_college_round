
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from audit import compare_results

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
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    pdf_bytes = await file.read()

    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file."
        )

    return {
        "status": "integration_pending",
        "message": "PDF received. Member 1 extractor not connected yet."
    }


@app.post("/run")
def run_experiment():
    raise HTTPException(
        status_code=501,
        detail="Member 2 experiment runner not connected yet."
    )


class AuditRequest(BaseModel):
    reported_accuracy: float = Field(ge=0, le=1)
    measured_accuracy: float = Field(ge=0, le=1)


@app.post("/audit")
def audit(request: AuditRequest):
    return compare_results(
        request.reported_accuracy,
        request.measured_accuracy
    )
