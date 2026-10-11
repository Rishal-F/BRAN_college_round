"""Extract page text from research-paper PDFs."""

from __future__ import annotations

import argparse
import json
import sys
import warnings
from pathlib import Path
from typing import TypedDict

import fitz


class PDFPage(TypedDict):
    """Text extracted from one PDF page."""

    page_number: int
    text: str


def extract_pdf_pages(pdf_path: str | Path) -> list[PDFPage]:
    """Extract text from each page of a PDF.

    Pages without extractable text are included with an empty ``text`` value
    and produce a warning so callers can distinguish them from missing pages.

    Raises:
        FileNotFoundError: If ``pdf_path`` does not exist or is not a file.
        ValueError: If the file is not a valid or readable PDF.
    """
    path = Path(pdf_path)
    if not path.is_file():
        raise FileNotFoundError(f"PDF file not found: {path}")

    try:
        document = fitz.open(path)
    except (fitz.FileDataError, RuntimeError) as error:
        raise ValueError(f"Unable to open a valid PDF: {path}") from error

    pages: list[PDFPage] = []
    try:
        for page_index, page in enumerate(document):
            text = page.get_text("text")
            if not text.strip():
                warnings.warn(
                    f"Page {page_index + 1} has no extractable text: {path}",
                    UserWarning,
                    stacklevel=2,
                )
            pages.append({"page_number": page_index + 1, "text": text})
    except (fitz.FileDataError, RuntimeError) as error:
        raise ValueError(f"Unable to read PDF pages: {path}") from error
    finally:
        document.close()

    return pages


def _build_parser() -> argparse.ArgumentParser:
    """Build the command-line argument parser."""
    parser = argparse.ArgumentParser(
        description="Extract text from each page of a PDF as JSON."
    )
    parser.add_argument("pdf_path", type=Path, help="Path to the PDF file")
    return parser


def main() -> int:
    """Run the command-line interface."""
    args = _build_parser().parse_args()
    try:
        pages = extract_pdf_pages(args.pdf_path)
    except (FileNotFoundError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(json.dumps(pages, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
