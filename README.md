# CrisisGrid — AI-Powered Research Reproducibility Workbench

> **12-Hour College Round Hackathon Project**  
> An automated, evidence-grounded workbench that investigates whether machine-learning results reported in research papers can be independently reproduced through structured evidence extraction, deterministic experiment configuration, and automated metric discrepancy auditing.

---

## ⚡ Team Architecture & Responsibilities

| Team Member | Module & Domain | Key Deliverables |
|---|---|---|
| **Member 1** | **AI Research Extraction** (`extraction/`) | PyMuPDF text reader, Ollama / Qwen2.5:3b structured extraction, citation grounding, schema validation, and scanned-PDF detection. |
| **Member 2** | **Experiment Runner & MLflow** (`backend/runner.py`) | Deterministic model training pipeline, MLflow run telemetry, accuracy measurement, and parameter configuration. |
| **Member 3** | **Interactive Lab Frontend** (`src/`) | React + Vite + Tailwind CSS + Framer Motion interactive UI, drag-and-drop paper intake, evidence inspector, live experiment runner, and visual audit gauge. |
| **Member 4** | **Backend & Discrepancy Engine** (`backend/main.py`) | FastAPI core architecture, `/health`, `/extract`, `/run`, `/audit` endpoints, tolerance threshold auditing, and automated test suite. |

---

## 📡 API Endpoints & Contract Matrix

| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/` | API welcome & system identity | ✅ Operational |
| `GET` | `/health` | Heartbeat & service health probe | ✅ Operational |
| `POST` | `/extract` | Multipart PDF upload → Structured research extraction with verbatim evidence citations | ✅ Operational |
| `POST` | `/run` | Runs experiment runner, logs parameters/metrics to MLflow, returns measured accuracy | ✅ Operational |
| `POST` | `/audit` | Audits reported vs. measured metrics with 2% tolerance threshold | ✅ Operational |

---

## 🚀 Quickstart Guide (Windows / VS Code)

### 1. Prerequisites
- **Python**: 3.10+ (tested with 3.14)
- **Node.js**: 18+ (tested with 20+)
- **Ollama**: Local instance running with `qwen2.5:3b` model:
  ```powershell
  # Start Ollama
  ollama run qwen2.5:3b
  ```

### 2. Backend Setup
From the repository root (`crisisgrid-integration`):
```powershell
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
From the repository root:
```powershell
# Install Node dependencies
npm install

# Start Vite development server on port 5173
npm run dev
```
- Web Application: `http://localhost:5173`

### 4. Running Automated Tests
```powershell
# Run the complete test suite (56 passing tests across extraction, runner, and API)
pytest
```

---

## 🎯 Hackathon Demonstration Workflow

For a rapid, deterministic live demonstration during judging, follow this 5-step sequence:

### Step 1: Paper Intake (`POST /extract`)
1. Open the UI at `http://localhost:5173` and navigate to the **Research Workspace**.
2. **Option A (Instant Demo Fixture)**: Click **"Instant Demo Fixture"** to instantly load the verified research extraction of the bundled `sample_research_paper.pdf` without waiting for CPU LLM latency.
3. **Option B (Live Ollama Inference)**: Drag & drop `sample_research_paper.pdf` and click **"Analyze Paper (POST /extract)"** to perform full live extraction via local Ollama.
4. *Expected Output*: Extracted claims are populated across 6 dimensions: Model Architecture, Dataset, Methodology, Hyperparameters, Evaluation Metrics, and Published Results.

### Step 2: Evidence Inspection
- Inspect verified verbatim quotations and page citations (e.g., `Page 1: "Reported Top-1 Validation Accuracy: 95.0%"`).
- Missing research facets (such as undefined dataset details) are highlighted with clear reproducibility warnings rather than hallucinated assumptions.

### Step 3: Run Reproduction Experiment (`POST /run`)
1. Switch to the **Experiment DAG & Config** tab.
2. Select algorithm (`RandomForest` or `SVM`) and configure parameters (e.g., `n_estimators: 100`, `random_state: 42`).
3. Click **"Run Reproduction Experiment"**.
4. *Expected Output*: The backend executes Member 2's deterministic runner, records telemetry to MLflow (`mlflow.db`), and returns the measured accuracy (e.g., `96.0%`) alongside the live MLflow Run ID.

### Step 4: Metric Discrepancy Audit (`POST /audit`)
1. Switch to the **Metric Audit Center** tab.
2. The values are automatically synchronized from Step 2 (Reported: `0.95`) and Step 3 (Measured: `0.96`).
3. Click **"Run Audit Comparison"**.
4. *Expected Output*: 
   - Discrepancy: `+0.0100` (`+1.00%`).
   - Outcome: **REPRODUCED** (within the 2.0% tolerance window).
   - Dynamic comparison gauge renders in green.

### Step 5: Findings & Transparency Export
- Review the consolidated reproducibility scorecard.
- Export findings summary markdown for publication or peer review.

---

## 🔬 Scientific & Technical Disclaimers

In adhering to strict academic and reproducibility ethics:
1. **Runner Scope**: Member 2's runner currently executes deterministic machine learning benchmarks (Random Forest and SVM on the benchmark dataset) with persistent MLflow tracking. The UI clearly identifies this as an infrastructure verification test rather than fabricating custom paper execution.
2. **Ollama Hardware Inference**: Ollama running `qwen2.5:3b` on CPU requires ~2–4 minutes per 2-page extraction depending on available system RAM and thermal throttling. The UI offers both live LLM extraction and instant pre-verified fixture execution to accommodate time-constrained hackathon pitch sessions.
3. **Scanned PDF Handling**: Scanned or image-only PDFs without extractable text layers are cleanly intercepted by `ScannedPDFError` (HTTP 422) with actionable error guidance.
