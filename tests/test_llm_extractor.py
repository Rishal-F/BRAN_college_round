import json
import os
import unittest
from unittest.mock import patch

from extraction import llm_extractor


def _valid_content() -> str:
    field = {"status": "missing", "claims": []}
    return json.dumps(
        {
            name: field
            for name in llm_extractor._FIELD_NAMES
        }
    )


def _content_with_methodology_claim(
    *,
    evidence: str = "We trained the model for ten epochs.",
    page_numbers: list[int] | None = None,
    evidence_ids: list[str] | None = None,
    value: str = "training for ten epochs",
) -> str:
    result = json.loads(_valid_content())
    result["methodology"] = {
        "status": "reported",
        "claims": [
            {
                "value": value,
                "page_numbers": page_numbers if page_numbers is not None else [7],
                "evidence_ids": evidence_ids if evidence_ids is not None else ["e001"],
                "evidence": evidence,
                "status": "reported",
            }
        ],
    }
    return json.dumps(result)


class _Response:
    def __init__(self, content: str, **metadata: object) -> None:
        body = {"message": {"content": content}, **metadata}
        self._body = json.dumps(body).encode()

    def __enter__(self) -> "_Response":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def read(self) -> bytes:
        return self._body


class _RawResponse(_Response):
    def __init__(self, body: str) -> None:
        self._body = body.encode()


class OllamaExtractionTests(unittest.TestCase):
    def test_demo_fixture_is_valid_research_details(self) -> None:
        details = llm_extractor._load_demo_details()

        self.assertEqual(
            [getattr(details, name).status for name in llm_extractor._FIELD_NAMES],
            ["missing", "missing", "missing", "missing", "missing", "reported"],
        )
        self.assertEqual(
            [
                len(getattr(details, name).claims)
                for name in llm_extractor._FIELD_NAMES
            ],
            [0, 0, 0, 0, 0, 1],
        )
        claim = details.published_or_reported_results.claims[0]
        self.assertEqual(claim.page_numbers, [9])
        self.assertEqual(claim.evidence_ids, ["e038"])
        self.assertIn("fewer equations", claim.evidence)
        self.assertIn("more tables", claim.evidence)

    def test_rejects_reported_field_with_empty_claims(self) -> None:
        result = json.loads(_valid_content())
        result["methodology"] = {"status": "reported", "claims": []}

        with self.assertRaisesRegex(
            llm_extractor.ValidationError,
            "a field with no claims must have status 'missing'",
        ):
            llm_extractor.ResearchDetails.model_validate(result)

    def test_rejects_uncertain_field_with_empty_claims(self) -> None:
        result = json.loads(_valid_content())
        result["methodology"] = {"status": "uncertain", "claims": []}

        with self.assertRaises(llm_extractor.ValidationError):
            llm_extractor.ResearchDetails.model_validate(result)

    def test_accepts_missing_field_with_empty_claims(self) -> None:
        result = json.loads(_valid_content())

        details = llm_extractor.ResearchDetails.model_validate(result)

        self.assertEqual(details.methodology.status, "missing")
        self.assertEqual(details.methodology.claims, [])

    @patch("extraction.llm_extractor.urlopen")
    def test_uses_schema_and_parses_message_content(self, urlopen: object) -> None:
        urlopen.side_effect = [_Response(_valid_content())]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama("PAGE", {1}, {1: "PAGE"})

        self.assertEqual(details.dataset.status, "missing")
        request = urlopen.call_args.args[0]  # type: ignore[attr-defined]
        body = json.loads(request.data)
        self.assertFalse(body["stream"])
        self.assertEqual(
            body["format"]["$defs"]["Claim"]["properties"]["page_numbers"]["items"][
                "enum"
            ],
            [1],
        )
        self.assertEqual(
            body["format"]["$defs"]["Claim"]["properties"]["evidence_ids"]["items"][
                "enum"
            ],
            ["e001"],
        )
        self.assertEqual(
            body["options"]["num_predict"],
            llm_extractor.DEFAULT_MAX_OUTPUT_TOKENS,
        )
        self.assertEqual(
            body["format"]["$defs"]["FieldExtraction"]["required"],
            ["status", "claims"],
        )
        self.assertEqual(
            body["format"]["$defs"]["Claim"]["required"],
            ["value", "page_numbers", "evidence_ids", "evidence", "status"],
        )
        self.assertIn(
            json.dumps(llm_extractor._RESEARCH_DETAILS_SCHEMA, separators=(",", ":")),
            body["messages"][0]["content"],
        )
        self.assertIn(llm_extractor._FIELD_STATUS_RULE, body["messages"][0]["content"])

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_truncated_json_with_generation_metadata(
        self, urlopen: object
    ) -> None:
        truncated = '{"model_or_algorithm":{"status":"reported","claims":[{"evidence":"cut'
        response = _Response(truncated, done=False, done_reason="length", eval_count=1024)
        urlopen.side_effect = [response, response]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"generation stopped at the configured output-token limit.*"
            r"OLLAMA_MAX_OUTPUT_TOKENS.*done_reason='length'.*eval_count=1024",
        ):
            llm_extractor._call_ollama("PAGE", {1})
        self.assertEqual(urlopen.call_count, 2)  # type: ignore[attr-defined]
        self.assertNotIn("cut", str(urlopen.call_args))  # type: ignore[attr-defined]

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_json_array_response(self, urlopen: object) -> None:
        response = _RawResponse("[]")
        urlopen.side_effect = [response]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            "JSON response object was expected",
        ):
            llm_extractor._call_ollama("PAGE", {1})
        self.assertEqual(urlopen.call_count, 1)  # type: ignore[attr-defined]

    @patch("extraction.llm_extractor.urlopen")
    def test_reports_non_limit_metadata_for_invalid_json(self, urlopen: object) -> None:
        response = _Response(
            '{"not":',
            done=False,
            done_reason="stop",
            eval_count=42,
        )
        urlopen.side_effect = [response, response]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"done_reason='stop'.*eval_count=42",
        ):
            llm_extractor._call_ollama("PAGE", {1})

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_unrelated_protocol_summary_response(self, urlopen: object) -> None:
        invalid = json.dumps({"protocol_summary": "unrelated", "features_description": []})
        urlopen.side_effect = [
            _Response(json.dumps(invalid)),
            _Response(json.dumps(invalid)),
        ]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            "invalid ResearchDetails JSON after one correction attempt",
        ):
            llm_extractor._call_ollama("PAGE", {1})

        self.assertEqual(urlopen.call_count, 2)  # type: ignore[attr-defined]
        correction = json.loads(urlopen.call_args_list[1].args[0].data)["messages"][-1]["content"]  # type: ignore[attr-defined]
        self.assertIn("validation errors", correction)
        self.assertIn(llm_extractor._FIELD_STATUS_RULE, correction)

    @patch.dict(
        "os.environ",
        {llm_extractor.OLLAMA_MAX_OUTPUT_TOKENS_ENV_VAR: "768"},
        clear=False,
    )
    @patch("extraction.llm_extractor.urlopen")
    def test_uses_configured_output_token_limit(self, urlopen: object) -> None:
        urlopen.side_effect = [_Response(_valid_content())]  # type: ignore[attr-defined]

        llm_extractor._call_ollama("PAGE", {1})

        request = urlopen.call_args.args[0]  # type: ignore[attr-defined]
        body = json.loads(request.data)
        self.assertEqual(body["options"]["num_predict"], 768)

    @patch.dict(
        "os.environ",
        {
            llm_extractor.OLLAMA_TIMEOUT_ENV_VAR: "300",
            llm_extractor.OLLAMA_MAX_OUTPUT_TOKENS_ENV_VAR: "1536",
        },
        clear=False,
    )
    @patch("extraction.llm_extractor.urlopen")
    def test_passes_configured_timeout_and_output_limit(
        self, urlopen: object
    ) -> None:
        urlopen.side_effect = [_Response(_valid_content())]  # type: ignore[attr-defined]

        llm_extractor._call_ollama("PAGE", {1})

        request = urlopen.call_args.args[0]  # type: ignore[attr-defined]
        body = json.loads(request.data)
        self.assertEqual(urlopen.call_args.kwargs["timeout"], 300)  # type: ignore[attr-defined]
        self.assertEqual(body["options"]["num_predict"], 1536)

    @patch("extraction.llm_extractor.urlopen")
    def test_correction_response_fixes_empty_reported_field(self, urlopen: object) -> None:
        invalid = json.loads(_valid_content())
        invalid["methodology"] = {"status": "reported", "claims": []}
        corrected = _valid_content()
        urlopen.side_effect = [
            _Response(json.dumps(invalid)),
            _Response(corrected),
        ]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama("PAGE 1", {1}, {1: "source"})

        self.assertEqual(details.methodology.status, "missing")
        self.assertEqual(urlopen.call_count, 2)  # type: ignore[attr-defined]
        correction = json.loads(
            urlopen.call_args_list[1].args[0].data  # type: ignore[attr-defined]
        )["messages"][-1]["content"]
        self.assertIn("methodology", correction)
        self.assertIn("status", correction)
        self.assertIn(llm_extractor._FIELD_STATUS_RULE, correction)

    @patch("extraction.llm_extractor.urlopen")
    def test_correction_response_fixes_missing_claim_status(
        self, urlopen: object
    ) -> None:
        invalid = json.loads(
            _content_with_methodology_claim(
                evidence="We trained the model for ten epochs."
            )
        )
        del invalid["methodology"]["claims"][0]["status"]
        corrected = _content_with_methodology_claim()
        urlopen.side_effect = [
            _Response(json.dumps(invalid)),
            _Response(corrected),
        ]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama(
            "PAGE 7\nWe trained the model for ten epochs.",
            {7},
            {7: "We trained the model for ten epochs."},
        )

        self.assertEqual(details.methodology.claims[0].status, "reported")
        correction = json.loads(
            urlopen.call_args_list[1].args[0].data  # type: ignore[attr-defined]
        )["messages"][-1]["content"]
        self.assertIn("methodology", correction)
        self.assertIn("status", correction)

    @patch("extraction.llm_extractor.urlopen")
    def test_correction_fixes_multiple_empty_reported_fields(
        self, urlopen: object
    ) -> None:
        invalid = json.loads(_valid_content())
        invalid["hyperparameters_and_experimental_configuration"] = {
            "status": "reported",
            "claims": [],
        }
        invalid["evaluation_metrics"] = {"status": "reported", "claims": []}
        urlopen.side_effect = [
            _Response(json.dumps(invalid)),
            _Response(_valid_content()),
        ]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama("PAGE 1", {1}, {1: "source"})

        self.assertEqual(
            details.hyperparameters_and_experimental_configuration.status,
            "missing",
        )
        self.assertEqual(details.evaluation_metrics.status, "missing")
        self.assertEqual(urlopen.call_count, 2)  # type: ignore[attr-defined]
        correction = json.loads(
            urlopen.call_args_list[1].args[0].data  # type: ignore[attr-defined]
        )["messages"][-1]["content"]
        self.assertIn("hyperparameters_and_experimental_configuration", correction)
        self.assertIn("evaluation_metrics", correction)
        self.assertIn("input_value={'status': 'reported'", correction)
        self.assertIn(llm_extractor._FIELD_STATUS_RULE, correction)
        self.assertIn(llm_extractor._FIELD_NAMES_RULE, correction)

    @patch("extraction.llm_extractor.urlopen")
    def test_accepts_exact_methodology_evidence(self, urlopen: object) -> None:
        excerpt = "We trained the model for ten epochs."
        urlopen.side_effect = [_Response(_content_with_methodology_claim())]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama(
            "PAGE 7\nWe trained the model for ten epochs.",
            {7},
            {7: excerpt},
        )

        self.assertEqual(details.methodology.claims[0].evidence, excerpt)

    @patch("extraction.llm_extractor.urlopen")
    def test_derives_original_evidence_from_selected_snippet(self, urlopen: object) -> None:
        urlopen.side_effect = [
            _Response(
                _content_with_methodology_claim(
                    evidence="",
                    evidence_ids=["e001"],
                )
            )
        ]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama(
            "PAGE 7\nWe trained the model for ten epochs.",
            {7},
            {7: "We trained the model for ten epochs."},
        )

        self.assertEqual(
            details.methodology.claims[0].evidence,
            "We trained the model for ten epochs.",
        )

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_unknown_evidence_id(self, urlopen: object) -> None:
        invalid = _content_with_methodology_claim(
            evidence="",
            evidence_ids=["e999"],
        )
        urlopen.side_effect = [_Response(invalid), _Response(invalid)]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"unknown evidence ID 'e999'",
        ):
            llm_extractor._call_ollama(
                "PAGE 7\nWe trained the model for ten epochs.",
                {7},
                {7: "We trained the model for ten epochs."},
            )

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_cross_page_evidence_id(self, urlopen: object) -> None:
        invalid = _content_with_methodology_claim(
            evidence="",
            page_numbers=[7],
            evidence_ids=["e002"],
        )
        urlopen.side_effect = [_Response(invalid), _Response(invalid)]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"page numbers .* do not match selected evidence IDs",
        ):
            llm_extractor._call_ollama(
                "PAGE 7\nPage seven.\nPAGE 8\nEvidence on page 8.",
                {7, 8},
                {7: "Page seven.", 8: "Evidence on page 8."},
            )

    @patch("extraction.llm_extractor.urlopen")
    def test_correction_fixes_page_numbers_for_selected_evidence(
        self, urlopen: object
    ) -> None:
        invalid = json.loads(
            _content_with_methodology_claim(
                evidence="",
                page_numbers=[7, 8],
                evidence_ids=["e001"],
            )
        )
        corrected = json.loads(
            _content_with_methodology_claim(
                evidence="",
                page_numbers=[7],
                evidence_ids=["e001"],
            )
        )
        urlopen.side_effect = [
            _Response(json.dumps(invalid)),
            _Response(json.dumps(corrected)),
        ]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama(
            "PAGE 7\nWe trained the model for ten epochs.",
            {7},
            {7: "We trained the model for ten epochs."},
        )

        self.assertEqual(details.methodology.claims[0].page_numbers, [7])
        correction = json.loads(
            urlopen.call_args_list[1].args[0].data  # type: ignore[attr-defined]
        )["messages"][-1]["content"]
        self.assertIn("page_numbers must be exactly", correction)
        self.assertIn("selected evidence_ids", correction)

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_numerical_claim_not_supported_by_selected_snippet(
        self, urlopen: object
    ) -> None:
        invalid = _content_with_methodology_claim(
            evidence="",
            evidence_ids=["e001"],
            value="accuracy was 90%",
        )
        urlopen.side_effect = [_Response(invalid), _Response(invalid)]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"numerical claim does not match selected evidence",
        ):
            llm_extractor._call_ollama(
                "PAGE 7\nThe model reached 91% accuracy.",
                {7},
                {7: "The model reached 91% accuracy."},
            )

    @patch("extraction.llm_extractor.urlopen")
    def test_accepts_pdf_formatting_differences_in_evidence(
        self, urlopen: object
    ) -> None:
        evidence = "The multi-stage method uses â€œrobustâ€ training."
        source = "The multi-\nstage method uses \"robust\"   training."
        urlopen.side_effect = [_Response(_content_with_methodology_claim(evidence=evidence))]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama(
            "PAGE 7\n" + source,
            {7},
            {7: source},
        )

        self.assertEqual(details.methodology.claims[0].evidence, source)

    @patch("extraction.llm_extractor.urlopen")
    def test_correction_replaces_paraphrased_evidence_with_exact_quote(
        self, urlopen: object
    ) -> None:
        paraphrase = _content_with_methodology_claim(
            evidence="The study trained its model for ten epochs."
        )
        urlopen.side_effect = [_Response(paraphrase)]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama(
            "PAGE 7\nWe trained the model for ten epochs.",
            {7},
            {7: "We trained the model for ten epochs."},
        )

        self.assertEqual(
            details.methodology.claims[0].evidence,
            "We trained the model for ten epochs.",
        )

    @patch("extraction.llm_extractor.urlopen")
    def test_does_not_match_meaningful_hyphen_difference(
        self, urlopen: object
    ) -> None:
        invalid = _content_with_methodology_claim(
            evidence="",
            evidence_ids=["e999"],
        )
        urlopen.side_effect = [_Response(invalid), _Response(invalid)]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"methodology claim 0: unknown evidence ID",
        ):
            llm_extractor._call_ollama(
                "PAGE 7\nThe state-of-the-art model reached 90%.",
                {7},
                {7: "The state-of-the-art model reached 90%."},
            )

    @patch("extraction.llm_extractor.urlopen")
    def test_does_not_match_changed_numeric_evidence(self, urlopen: object) -> None:
        invalid = _content_with_methodology_claim(
            evidence="",
            evidence_ids=["e001"],
            value="accuracy was 91%",
        )
        urlopen.side_effect = [_Response(invalid), _Response(invalid)]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"methodology claim 0: numerical claim does not match selected evidence; "
            r"unsupported number",
        ):
            llm_extractor._call_ollama(
                "PAGE 7\nThe model reached 90.0% accuracy.",
                {7},
                {7: "The model reached 90.0% accuracy."},
            )
        correction = json.loads(
            urlopen.call_args_list[1].args[0].data  # type: ignore[attr-defined]
        )["messages"][-1]["content"]
        self.assertIn("Remove the unsupported claim", correction)
        self.assertIn("never invent evidence", correction)

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_evidence_not_present_in_cited_page(self, urlopen: object) -> None:
        invalid = _content_with_methodology_claim(
            evidence="",
            evidence_ids=["e999"],
        )
        urlopen.side_effect = [_Response(invalid), _Response(invalid)]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"methodology claim 0: unknown evidence ID",
        ):
            llm_extractor._call_ollama(
                "PAGE 7\nActual source text.",
                {7},
                {7: "Actual source text."},
            )

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_evidence_from_different_page_in_same_chunk(
        self, urlopen: object
    ) -> None:
        invalid = _content_with_methodology_claim(
            evidence="",
            page_numbers=[7],
            evidence_ids=["e002"],
        )
        urlopen.side_effect = [_Response(invalid), _Response(invalid)]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"methodology claim 0: page numbers .* do not match selected evidence IDs",
        ):
            llm_extractor._call_ollama(
                "PAGE 7\nPage seven.\nPAGE 8\nEvidence on page 8.",
                {7, 8},
                {7: "Page seven.", 8: "Evidence on page 8."},
            )

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_reported_claim_with_missing_evidence(self, urlopen: object) -> None:
        invalid = json.loads(_content_with_methodology_claim(evidence=""))
        invalid["methodology"]["claims"][0]["evidence_ids"] = []
        urlopen.side_effect = [
            _Response(json.dumps(invalid)),
            _Response(json.dumps(invalid)),
        ]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"methodology claim 0: evidence is missing",
        ):
            llm_extractor._call_ollama("PAGE 7", {7}, {7: "source"})

    @patch("extraction.llm_extractor.urlopen")
    def test_rejects_invalid_methodology_page_number(self, urlopen: object) -> None:
        invalid = _content_with_methodology_claim(page_numbers=[8])
        urlopen.side_effect = [_Response(invalid), _Response(invalid)]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"methodology claim 0: invalid page number",
        ):
            llm_extractor._call_ollama(
                "PAGE 7\nWe trained the model for ten epochs.",
                {7},
                {7: "We trained the model for ten epochs."},
            )

    @patch("extraction.llm_extractor.urlopen")
    def test_accepts_missing_claim_without_value_or_evidence(self, urlopen: object) -> None:
        result = json.loads(_valid_content())
        result["methodology"] = {
            "status": "missing",
            "claims": [
                {
                    "value": None,
                    "page_numbers": [],
                    "evidence": "",
                    "status": "missing",
                }
            ],
        }
        urlopen.side_effect = [_Response(json.dumps(result))]  # type: ignore[attr-defined]

        details = llm_extractor._call_ollama("PAGE 7", {7}, {7: "source"})

        self.assertIsNone(details.methodology.claims[0].value)

    @patch.dict("os.environ", {}, clear=False)
    @patch("extraction.llm_extractor.urlopen")
    def test_reports_timed_out_chunk_and_uses_configured_timeout(
        self, urlopen: object
    ) -> None:
        os.environ[llm_extractor.OLLAMA_TIMEOUT_ENV_VAR] = "240"
        urlopen.side_effect = TimeoutError("mock timeout")  # type: ignore[attr-defined]

        with self.assertRaisesRegex(
            llm_extractor.ExtractionError,
            r"timed out while processing page chunk \[3, 4\].*OLLAMA_TIMEOUT_SECONDS",
        ):
            llm_extractor._call_ollama(
                "PAGE 3\nPAGE 4",
                {3, 4},
                {3: "source", 4: "source"},
            )

        self.assertEqual(
            urlopen.call_args.kwargs["timeout"],  # type: ignore[attr-defined]
            240,
        )
        self.assertEqual(urlopen.call_count, 1)  # type: ignore[attr-defined]

    def test_chunks_are_smaller_without_changing_page_numbers(self) -> None:
        pages = [
            {"page_number": 10, "text": "ten"},
            {"page_number": 20, "text": "twenty"},
            {"page_number": 30, "text": "thirty"},
        ]

        chunks = llm_extractor._chunk_pages(pages, llm_extractor.DEFAULT_CHUNK_SIZE)

        self.assertEqual([[page["page_number"] for page in chunk] for chunk in chunks], [
            [10, 20],
            [30],
        ])

    def test_combining_missing_claims_keeps_field_missing(self) -> None:
        extraction = llm_extractor.ResearchDetails.model_validate(
            json.loads(_valid_content())
        )
        result = llm_extractor._combine([extraction])

        self.assertEqual(result.methodology.status, "missing")

    def test_combining_preserves_all_six_categories(self) -> None:
        fields = {}
        for index, field_name in enumerate(llm_extractor._FIELD_NAMES, start=1):
            fields[field_name] = {
                "status": "reported",
                "claims": [
                    {
                        "value": f"fact {index}",
                        "page_numbers": [index],
                        "evidence_ids": [f"p{index}-s001"],
                        "evidence": f"source {index}",
                        "status": "reported",
                    }
                ],
            }

        result = llm_extractor._combine(
            [llm_extractor.ResearchDetails.model_validate(fields)]
        )

        self.assertEqual(
            [getattr(result, name).status for name in llm_extractor._FIELD_NAMES],
            ["reported"] * 6,
        )
        self.assertEqual(
            [len(getattr(result, name).claims) for name in llm_extractor._FIELD_NAMES],
            [1] * 6,
        )

    @patch("extraction.llm_extractor._call_ollama")
    def test_failed_chunk_is_not_silently_skipped(self, call_ollama: object) -> None:
        extraction = llm_extractor.ResearchDetails.model_validate(
            json.loads(_valid_content())
        )
        call_ollama.side_effect = [extraction, llm_extractor.ExtractionError("failed")]  # type: ignore[attr-defined]

        with self.assertRaisesRegex(llm_extractor.ExtractionError, "failed"):
            llm_extractor.extract_research_details(
                [
                    {"page_number": 1, "text": "one"},
                    {"page_number": 2, "text": "two"},
                    {"page_number": 3, "text": "three"},
                ]
            )
        self.assertEqual(call_ollama.call_count, 2)  # type: ignore[attr-defined]

    def test_chunking_includes_final_partial_chunk(self) -> None:
        pages = [
            {"page_number": 1, "text": "one"},
            {"page_number": 2, "text": "two"},
            {"page_number": 3, "text": "three"},
            {"page_number": 4, "text": "four"},
            {"page_number": 5, "text": "five"},
        ]

        chunks = llm_extractor._chunk_pages(pages, 2)

        self.assertEqual(
            [[page["page_number"] for page in chunk] for chunk in chunks],
            [[1, 2], [3, 4], [5]],
        )

    def test_empty_evidence_ids_omits_empty_enum_array(self) -> None:
        """Verify that when a page has no evidence snippets, enum is omitted from items."""
        schema = llm_extractor._request_schema(
            allowed_page_numbers={1},
            source_pages={1: ""},
        )
        claim_properties = schema["$defs"]["Claim"]["properties"]
        evidence_items = claim_properties["evidence_ids"]["items"]
        self.assertEqual(evidence_items.get("type"), "string")
        self.assertNotIn("enum", evidence_items)

    def test_empty_pages_returns_missing_details_without_calling_ollama(self) -> None:
        """Verify that empty page list or blank pages return missing fields without Ollama call."""
        res = llm_extractor.extract_research_details([])
        self.assertEqual(res.methodology.status, "missing")

        res_blank = llm_extractor.extract_research_details([{"page_number": 1, "text": "   "}])
        self.assertEqual(res_blank.dataset.status, "missing")


if __name__ == "__main__":
    unittest.main()

