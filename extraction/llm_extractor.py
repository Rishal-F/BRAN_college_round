"""Extract evidence-backed research details from PDF page text with Ollama."""

from __future__ import annotations

import argparse
import copy
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path
from typing import Literal, TypedDict
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

try:
    from .pdf_reader import PDFPage, extract_pdf_pages
except ImportError:  # pragma: no cover - supports direct script execution.
    from pdf_reader import PDFPage, extract_pdf_pages


OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen2.5:3b"
DEFAULT_CHUNK_SIZE = 2
DEFAULT_REQUEST_TIMEOUT_SECONDS = 180
DEFAULT_MAX_OUTPUT_TOKENS = 2048
OLLAMA_TIMEOUT_ENV_VAR = "OLLAMA_TIMEOUT_SECONDS"
OLLAMA_MAX_OUTPUT_TOKENS_ENV_VAR = "OLLAMA_MAX_OUTPUT_TOKENS"
DEMO_FIXTURE_PATH = Path(__file__).with_name("demo_research_details.json")


class Claim(BaseModel):
    """One claim and the page evidence supporting it."""

    model_config = ConfigDict(extra="forbid")

    value: str | None = None
    page_numbers: list[int] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    evidence: str = ""
    status: Literal["reported", "missing", "uncertain"]


class FieldExtraction(BaseModel):
    """Evidence-backed claims for one research-paper field."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["reported", "missing", "uncertain"]
    claims: list[Claim] = Field(default_factory=list)

    @model_validator(mode="after")
    def require_missing_status_for_empty_fields(self) -> "FieldExtraction":
        if not self.claims and self.status != "missing":
            raise ValueError(
                "a field with no claims must have status 'missing'"
            )
        return self


class ResearchDetails(BaseModel):
    """Validated research details extracted from a paper."""

    model_config = ConfigDict(extra="forbid")

    model_or_algorithm: FieldExtraction
    dataset: FieldExtraction
    methodology: FieldExtraction
    hyperparameters_and_experimental_configuration: FieldExtraction
    evaluation_metrics: FieldExtraction
    published_or_reported_results: FieldExtraction


class _PageRecord(TypedDict):
    """The page shape used when constructing a prompt."""

    page_number: int
    text: str


class _EvidenceSnippet(TypedDict):
    snippet_id: str
    page_number: int
    text: str


class ExtractionError(RuntimeError):
    """Raised when Ollama cannot return a valid extraction."""


def _load_demo_details(fixture_path: Path = DEMO_FIXTURE_PATH) -> ResearchDetails:
    """Load the explicitly labeled, local demo fixture through Pydantic."""
    try:
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
        return ResearchDetails.model_validate(fixture)
    except (OSError, json.JSONDecodeError, ValidationError) as error:
        raise ExtractionError(
            f"Demo fixture is invalid: {fixture_path}"
        ) from error


_FIELD_NAMES = (
    "model_or_algorithm",
    "dataset",
    "methodology",
    "hyperparameters_and_experimental_configuration",
    "evaluation_metrics",
    "published_or_reported_results",
)

_RESEARCH_DETAILS_SCHEMA = ResearchDetails.model_json_schema()
_CLAIM_SCHEMA = _RESEARCH_DETAILS_SCHEMA["$defs"]["Claim"]
_CLAIM_SCHEMA.pop("anyOf", None)
_CLAIM_SCHEMA["required"] = [
    "value",
    "page_numbers",
    "evidence_ids",
    "evidence",
    "status",
]
_FIELD_SCHEMA = _RESEARCH_DETAILS_SCHEMA["$defs"]["FieldExtraction"]
_FIELD_SCHEMA.pop("anyOf", None)
_FIELD_SCHEMA["required"] = ["status", "claims"]
_FIELD_STATUS_RULE = (
    'Every "reported" or "uncertain" field must contain at least one claim. '
    'A field with an empty "claims" list must have status "missing".'
)
_FIELD_NAMES_RULE = "The exact fields to check are: " + ", ".join(_FIELD_NAMES) + "."

_SYSTEM_PROMPT = f"""You extract research-paper facts from supplied page text.
Use only the supplied text. Do not use outside knowledge, inference, or guesses.
Return ONLY one JSON object matching this exact ResearchDetails schema:
{json.dumps(_RESEARCH_DETAILS_SCHEMA, separators=(",", ":"))}
{_FIELD_STATUS_RULE}
{_FIELD_NAMES_RULE}
Every reported or uncertain claim must have page_numbers copied from the
supplied page labels and a short, verbatim evidence excerpt copied from the
supplied page text. The page number must be the original page number shown in
the supplied page label. Select one or more application-provided evidence_ids
whose snippets support the claim. Do not invent or alter an evidence_id. The
"evidence" value should copy a short quotation from the selected snippet(s);
the application will verify the IDs and preserve the original source text.
Never use the claim value as evidence.
Do not paraphrase, summarize, or rewrite evidence. Never invent a page number
or evidence. For missing
information, use field status "missing" with an empty claims list. Every claim
object must include all five fields: value, page_numbers, evidence_ids,
evidence, and status. A missing claim uses status "missing", value null, empty
page_numbers, empty evidence_ids, and empty evidence. If text is ambiguous,
use "uncertain" and include the supporting page evidence. Keep the output
concise: include only necessary claims, use short verbatim evidence excerpts,
and avoid explanations outside the JSON.
Do not include markdown fences or commentary."""


def _empty_field() -> FieldExtraction:
    return FieldExtraction(status="missing", claims=[])


def _chunk_pages(pages: list[PDFPage], chunk_size: int) -> list[list[PDFPage]]:
    """Split pages into bounded chunks without changing their page numbers."""
    return [pages[index : index + chunk_size] for index in range(0, len(pages), chunk_size)]


def _build_prompt(pages: list[PDFPage]) -> str:
    page_text = "\n\n".join(
        f"--- PAGE {page['page_number']} ---\n{page['text']}" for page in pages
    )
    return (
        "Extract the requested fields from these pages. A claim may cite more "
        "than one supplied page, but page_numbers must be the actual labels. "
        "For each supported claim, select evidence_ids from the evidence "
        "catalog below and use only IDs on the cited pages. If no catalog "
        "snippet supports a claim, do not make the claim reported.\n\n"
        f"{page_text}\n\n{_format_evidence_catalog(pages)}"
    )


def _build_evidence_snippets(
    source_pages: dict[int, str],
) -> dict[str, _EvidenceSnippet]:
    snippets: dict[str, _EvidenceSnippet] = {}
    snippet_number = 1
    for page_number in sorted(source_pages):
        paragraphs = re.split(r"\r?\n\s*\r?\n", source_pages[page_number])
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            for offset in range(0, len(paragraph), 240):
                text = paragraph[offset : offset + 240]
                snippet_id = f"e{snippet_number:03d}"
                snippets[snippet_id] = {
                    "snippet_id": snippet_id,
                    "page_number": page_number,
                    "text": text,
                }
                snippet_number += 1
    return snippets


def _format_evidence_catalog(pages: list[PDFPage]) -> str:
    snippets = _build_evidence_snippets(
        {page["page_number"]: page["text"] for page in pages}
    )
    lines = ["Evidence catalog (IDs are stable within this request):"]
    for snippet in snippets.values():
        lines.append(
            f"[{snippet['snippet_id']}] PAGE {snippet['page_number']}: "
            f"{snippet['text']}"
        )
    return "\n".join(lines)


def _request_schema(
    allowed_page_numbers: set[int],
    source_pages: dict[int, str] | None = None,
) -> dict[str, object]:
    schema = copy.deepcopy(_RESEARCH_DETAILS_SCHEMA)
    claim_schema = schema["$defs"]["Claim"]
    claim_properties = claim_schema["properties"]
    claim_properties["page_numbers"]["items"] = {
        "type": "integer",
        "enum": sorted(allowed_page_numbers),
    }
    if source_pages is not None:
        evidence_ids = sorted(_build_evidence_snippets(source_pages))
        claim_properties["evidence_ids"]["items"] = {
            "type": "string",
            "enum": evidence_ids,
        }
    return schema


def _numeric_tokens(text: str) -> set[str]:
    return {
        token.lower()
        for token in re.findall(r"\b\d+(?:[.,]\d+)?%?\b", text)
    }


def _request_timeout_seconds() -> int:
    configured_timeout = os.environ.get(
        OLLAMA_TIMEOUT_ENV_VAR,
        str(DEFAULT_REQUEST_TIMEOUT_SECONDS),
    )
    try:
        timeout = int(configured_timeout)
    except ValueError as error:
        raise ExtractionError(
            f"{OLLAMA_TIMEOUT_ENV_VAR} must be a positive integer number of seconds."
        ) from error
    if timeout <= 0:
        raise ExtractionError(
            f"{OLLAMA_TIMEOUT_ENV_VAR} must be a positive integer number of seconds."
        )
    return timeout


def _max_output_tokens() -> int:
    configured_limit = os.environ.get(
        OLLAMA_MAX_OUTPUT_TOKENS_ENV_VAR,
        str(DEFAULT_MAX_OUTPUT_TOKENS),
    )
    try:
        limit = int(configured_limit)
    except ValueError as error:
        raise ExtractionError(
            f"{OLLAMA_MAX_OUTPUT_TOKENS_ENV_VAR} must be a positive integer."
        ) from error
    if limit <= 0:
        raise ExtractionError(
            f"{OLLAMA_MAX_OUTPUT_TOKENS_ENV_VAR} must be a positive integer."
        )
    return limit


def _ground_claim_evidence(
    details: ResearchDetails,
    allowed_page_numbers: set[int],
    source_pages: dict[int, str],
) -> None:
    snippets = _build_evidence_snippets(source_pages)
    for field_name in _FIELD_NAMES:
        for claim_index, claim in enumerate(getattr(details, field_name).claims):
            if claim.status not in {"reported", "uncertain"}:
                continue
            prefix = f"{field_name} claim {claim_index}"
            if not claim.evidence_ids:
                if not claim.evidence.strip():
                    raise ValueError(f"{prefix}: evidence is missing")
                raise ValueError(f"{prefix}: evidence ID(s) are missing")
            selected: list[_EvidenceSnippet] = []
            for evidence_id in claim.evidence_ids:
                snippet = snippets.get(evidence_id)
                if snippet is None:
                    raise ValueError(f"{prefix}: unknown evidence ID {evidence_id!r}")
                if snippet["page_number"] not in allowed_page_numbers:
                    raise ValueError(
                        f"{prefix}: evidence ID {evidence_id!r} belongs to page "
                        f"{snippet['page_number']}, outside this chunk"
                    )
                selected.append(snippet)
            selected_pages = {snippet["page_number"] for snippet in selected}
            invalid_pages = set(claim.page_numbers) - allowed_page_numbers
            if invalid_pages:
                raise ValueError(
                    f"{prefix}: invalid page number(s) {sorted(invalid_pages)}; "
                    f"allowed pages are {sorted(allowed_page_numbers)}"
                )
            if set(claim.page_numbers) != selected_pages:
                raise ValueError(
                    f"{prefix}: page numbers {sorted(set(claim.page_numbers))} "
                    f"do not match selected evidence IDs, which belong to page(s) "
                    f"{sorted(selected_pages)}"
                )
            source_evidence = "\n".join(snippet["text"] for snippet in selected)
            missing_numbers = _numeric_tokens(claim.value or "") - _numeric_tokens(
                source_evidence
            )
            if missing_numbers:
                raise ValueError(
                    f"{prefix}: numerical claim does not match selected evidence; "
                    f"unsupported number(s) {sorted(missing_numbers)}"
                )
            claim.evidence = source_evidence


def _validate_evidence(
    details: ResearchDetails,
    allowed_page_numbers: set[int],
    source_pages: dict[int, str],
) -> None:
    _ground_claim_evidence(details, allowed_page_numbers, source_pages)
    for field_name in _FIELD_NAMES:
        for claim_index, claim in enumerate(getattr(details, field_name).claims):
            if claim.status not in {"reported", "uncertain"}:
                continue
            if not claim.evidence.strip():
                raise ValueError(
                    f"{field_name} claim {claim_index}: evidence is missing"
                )
            if not claim.page_numbers:
                raise ValueError(
                    f"{field_name} claim {claim_index}: page number is missing"
                )
            invalid_pages = set(claim.page_numbers) - allowed_page_numbers
            if invalid_pages:
                raise ValueError(
                    f"{field_name} claim {claim_index}: invalid page number(s) "
                    f"{sorted(invalid_pages)}; allowed pages are "
                    f"{sorted(allowed_page_numbers)}"
                )


def _normalize_for_matching(text: str) -> str:
    """Normalize PDF formatting artifacts for comparison without changing output."""
    normalized = unicodedata.normalize("NFKC", text).replace("\u00ad", "")
    normalized = re.sub(
        r"(?<=\w)-\s*(?:\r?\n)+\s*(?=\w)",
        "-",
        normalized,
    )
    normalized = normalized.translate(
        str.maketrans(
            {
                "\u2018": "'",
                "\u2019": "'",
                "\u201c": '"',
                "\u201d": '"',
                "\u2013": "-",
                "\u2014": "-",
            }
        )
    )
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def _generation_metadata(response_data: dict[str, object]) -> str:
    metadata: list[str] = []
    done_reason = response_data.get("done_reason")
    eval_count = response_data.get("eval_count")
    if isinstance(done_reason, str):
        metadata.append(f"done_reason={done_reason!r}")
    if isinstance(eval_count, int):
        metadata.append(f"eval_count={eval_count}")
    if not metadata:
        return "Ollama supplied no generation stop metadata."
    return "Ollama generation metadata: " + ", ".join(metadata) + "."


def _invalid_json_error(
    error: json.JSONDecodeError,
    response_data: dict[str, object],
) -> ValueError:
    metadata = _generation_metadata(response_data)
    if response_data.get("done_reason") == "length":
        return ValueError(
            f"{error}; generation stopped at the configured output-token limit. "
            f"Increase {OLLAMA_MAX_OUTPUT_TOKENS_ENV_VAR} if needed. {metadata}"
        )
    return ValueError(f"{error}; {metadata}")


def _correction_prompt(
    validation_error: str,
    allowed_page_numbers: set[int],
) -> str:
    page_labels = ", ".join(str(number) for number in sorted(allowed_page_numbers))
    numeric_correction = ""
    if "numerical claim does not match selected evidence" in validation_error:
        numeric_correction = (
            "For this numerical validation error, do not preserve the claim "
            "unless the selected evidence contains every reported number. "
            "Remove the unsupported claim or represent it as a missing claim; "
            "never invent evidence or a replacement number. "
        )
    return (
        "Correction required. Return only one complete JSON object matching the "
        "exact ResearchDetails schema. Fix these validation errors; the specific "
        "failure is: "
        f"{validation_error} Only cite these supplied page numbers: [{page_labels}]. "
        "Select evidence_ids only from the application-provided evidence catalog "
        "in the original request; do not invent IDs or use an ID from another page. "
        f"{numeric_correction}"
        "For each claim, page_numbers must be exactly the unique page numbers "
        "owned by its selected evidence_ids; do not infer or add paper page "
        "numbers that are not owned by those IDs. "
        "For every reported or uncertain claim, copy a short exact quotation "
        "character-for-character from its cited page; do not paraphrase, summarize, "
        "or use the claim value as evidence. If the supplied pages do not contain "
        "all numbers in the claim value, select additional supporting evidence_ids "
        "from the catalog or do not make that numerical claim. If the supplied "
        "pages do not contain a verifiable quotation for a claim, do not invent one: represent the "
        "information as missing or uncertain with the appropriate evidence and "
        "page references, or mark the field missing with an empty claims list. "
        f"{_FIELD_STATUS_RULE} {_FIELD_NAMES_RULE}"
    )


def _call_ollama(
    prompt: str,
    allowed_page_numbers: set[int],
    source_pages: dict[int, str] | None = None,
) -> ResearchDetails:
    chunk_label = ", ".join(str(page_number) for page_number in sorted(allowed_page_numbers))
    request_schema = _request_schema(allowed_page_numbers, source_pages)
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]
    validation_error = ""
    for attempt in range(2):
        request_body = json.dumps(
            {
                "model": OLLAMA_MODEL,
                "stream": False,
                "format": request_schema,
                "options": {"num_predict": _max_output_tokens()},
                "messages": messages,
            }
        ).encode("utf-8")
        request = Request(
            OLLAMA_URL,
            data=request_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urlopen(request, timeout=_request_timeout_seconds()) as response:
                response_data = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code == 404:
                raise ExtractionError(
                    f"Ollama returned HTTP 404. Ensure model {OLLAMA_MODEL!r} is available."
                ) from error
            raise ExtractionError(
                f"Ollama returned HTTP {error.code}: {error.reason}"
            ) from error
        except URLError as error:
            raise ExtractionError(
                "Could not connect to Ollama at http://localhost:11434. "
                "Start Ollama and try again."
            ) from error
        except TimeoutError as error:
            raise ExtractionError(
                f"The Ollama request timed out while processing page chunk "
                f"[{chunk_label}]. Retry the command, or set "
                f"{OLLAMA_TIMEOUT_ENV_VAR} to a larger positive number of seconds."
            ) from error
        except json.JSONDecodeError as error:
            raise ExtractionError("Ollama returned a non-JSON HTTP response.") from error

        if not isinstance(response_data, dict):
            raise ExtractionError("Ollama returned a JSON response object was expected.")
        if response_data.get("error"):
            raise ExtractionError(f"Ollama error: {response_data['error']}")
        try:
            content = response_data["message"]["content"]
        except (KeyError, TypeError) as error:
            raise ExtractionError("Ollama response had no message content.") from error
        if not isinstance(content, str):
            raise ExtractionError("Ollama message content was not text.")

        try:
            parsed_content = json.loads(content)
            details = ResearchDetails.model_validate(parsed_content)
            _validate_evidence(details, allowed_page_numbers, source_pages or {})
            return details
        except json.JSONDecodeError as error:
            validation_error = str(_invalid_json_error(error, response_data))
            if attempt == 0:
                messages.append(
                    {
                        "role": "user",
                        "content": _correction_prompt(
                            validation_error,
                            allowed_page_numbers,
                        ),
                    }
                )
                continue
            raise ExtractionError(
                "Ollama returned invalid ResearchDetails JSON after one correction "
                f"attempt: {validation_error}"
            ) from error
        except (ValidationError, ValueError) as error:
            validation_error = str(error)
            if attempt == 0:
                messages.append(
                    {
                        "role": "user",
                        "content": _correction_prompt(
                            validation_error,
                            allowed_page_numbers,
                        ),
                    }
                )
                continue
            raise ExtractionError(
                "Ollama returned invalid ResearchDetails JSON after one correction "
                f"attempt: {validation_error}"
            ) from error
    raise AssertionError("The Ollama validation loop did not return or raise.")


def _diagnose_first_page(pdf_path: Path) -> dict[str, object]:
    """Send one page through the strict request path and return safe diagnostics."""
    pages = extract_pdf_pages(pdf_path)
    if not pages:
        raise ExtractionError("The PDF contains no pages.")
    page = pages[0]
    source_pages = {page["page_number"]: page["text"]}
    request_schema = _request_schema({page["page_number"]}, source_pages)
    prompt = _build_prompt([page])
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                "Diagnostic: extract this single page concisely. Return complete "
                "JSON only; do not include commentary.\n\n" + prompt
            ),
        },
    ]
    request_body = json.dumps(
        {
            "model": OLLAMA_MODEL,
            "stream": False,
            "format": request_schema,
            "options": {"num_predict": _max_output_tokens()},
            "messages": messages,
        }
    ).encode("utf-8")
    request = Request(
        OLLAMA_URL,
        data=request_body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    started = time.perf_counter()
    try:
        with urlopen(request, timeout=_request_timeout_seconds()) as response:
            http_status = getattr(response, "status", None)
            response_data = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        elapsed = time.perf_counter() - started
        return {
            "page_number": page["page_number"],
            "elapsed_seconds": round(elapsed, 2),
            "prompt_characters": sum(len(message["content"]) for message in messages),
            "response_characters": 0,
            "http_status": None,
            "outcome": "request_error",
            "error": str(error),
            "valid_research_details": False,
        }
    elapsed = time.perf_counter() - started
    if not isinstance(response_data, dict):
        return {
            "page_number": page["page_number"],
            "elapsed_seconds": round(elapsed, 2),
            "prompt_characters": sum(len(message["content"]) for message in messages),
            "response_characters": 0,
            "http_status": http_status,
            "outcome": "invalid_response",
            "error": "Ollama returned a non-object JSON response.",
            "valid_research_details": False,
        }
    if response_data.get("error"):
        return {
            "page_number": page["page_number"],
            "elapsed_seconds": round(elapsed, 2),
            "prompt_characters": sum(len(message["content"]) for message in messages),
            "response_characters": 0,
            "http_status": http_status,
            "outcome": "ollama_error",
            "error": "Ollama returned an error.",
            "valid_research_details": False,
        }
    try:
        content = response_data["message"]["content"]
    except (KeyError, TypeError) as error:
        return {
            "page_number": page["page_number"],
            "elapsed_seconds": round(elapsed, 2),
            "prompt_characters": sum(len(message["content"]) for message in messages),
            "response_characters": 0,
            "http_status": http_status,
            "outcome": "invalid_response",
            "error": "First-page diagnostic had no message content.",
            "valid_research_details": False,
        }
    if not isinstance(content, str):
        return {
            "page_number": page["page_number"],
            "elapsed_seconds": round(elapsed, 2),
            "prompt_characters": sum(len(message["content"]) for message in messages),
            "response_characters": 0,
            "http_status": http_status,
            "outcome": "invalid_response",
            "error": "First-page diagnostic content was not text.",
            "valid_research_details": False,
        }
    result: dict[str, object] = {
        "page_number": page["page_number"],
        "elapsed_seconds": round(elapsed, 2),
        "prompt_characters": sum(len(message["content"]) for message in messages),
        "response_characters": len(content),
        "http_status": http_status,
        "done": response_data.get("done"),
        "done_reason": response_data.get("done_reason"),
        "eval_count": response_data.get("eval_count"),
    }
    try:
        details = ResearchDetails.model_validate(json.loads(content))
        _validate_evidence(details, {page["page_number"]}, {page["page_number"]: page["text"]})
    except (json.JSONDecodeError, ValidationError, ValueError) as error:
        result["outcome"] = "invalid_output"
        result["error"] = str(error).split("input_value=", 1)[0].strip()
        result["valid_research_details"] = False
        return result
    result["outcome"] = "ok"
    result["valid_research_details"] = True
    return result


def _combine(extractions: list[ResearchDetails]) -> ResearchDetails:
    combined: dict[str, FieldExtraction] = {}
    for field_name in _FIELD_NAMES:
        claims: list[Claim] = []
        for extraction in extractions:
            claims.extend(getattr(extraction, field_name).claims)
        status: Literal["reported", "missing", "uncertain"]
        if any(claim.status == "uncertain" for claim in claims):
            status = "uncertain"
        elif any(claim.status == "reported" for claim in claims):
            status = "reported"
        else:
            status = "missing"
        combined[field_name] = FieldExtraction(status=status, claims=claims)
    return ResearchDetails.model_validate(combined)


def extract_research_details(pages: list[PDFPage]) -> ResearchDetails:
    """Extract evidence-backed research details from PDF page records.

    Long papers are sent to Ollama in two-page chunks. The returned Pydantic
    model contains only claims and page references returned for those chunks.
    """
    if not pages:
        return ResearchDetails(**{name: _empty_field() for name in _FIELD_NAMES})
    extractions = [
        _call_ollama(
            _build_prompt(chunk),
            {page["page_number"] for page in chunk},
            {page["page_number"]: page["text"] for page in chunk},
        )
        for chunk in _chunk_pages(pages, DEFAULT_CHUNK_SIZE)
    ]
    return _combine(extractions)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extract evidence-backed research details from a PDF."
    )
    parser.add_argument("pdf_path", type=Path, nargs="?", help="Path to the PDF file")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Use the local validated demo fixture instead of Ollama/PDF extraction",
    )
    parser.add_argument(
        "--diagnose-first-page",
        action="store_true",
        help="Send only the first PDF page and print safe timing/response diagnostics",
    )
    return parser


def main() -> int:
    """Run the PDF research-detail extraction command-line interface."""
    args = _build_parser().parse_args()
    try:
        if args.demo:
            if args.pdf_path is not None:
                raise ExtractionError("--demo does not accept a PDF path.")
            print(
                "DEMO MODE: using local illustrative fixture; no live AI extraction.",
                file=sys.stderr,
            )
            print(
                json.dumps(
                    _load_demo_details().model_dump(mode="json"),
                    ensure_ascii=True,
                    indent=2,
                )
            )
            return 0
        if args.pdf_path is None:
            raise ExtractionError("A PDF path is required unless --demo is used.")
        if args.diagnose_first_page:
            diagnostic = _diagnose_first_page(args.pdf_path)
            print(json.dumps(diagnostic, indent=2))
            return 0 if diagnostic["valid_research_details"] else 1
        pages = extract_pdf_pages(args.pdf_path)
        details = extract_research_details(pages)
    except (FileNotFoundError, ValueError, ExtractionError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    print(details.model_dump_json(indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
