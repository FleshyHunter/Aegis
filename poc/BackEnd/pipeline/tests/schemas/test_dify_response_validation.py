import unittest

from pipeline.schemas import (
    PipelineResponseValidationError,
    validate_evaluation_response,
    validate_routing_response,
)


class TestDifyResponseValidation(unittest.TestCase):
    def test_validate_routing_response_accepts_expected_shape(self):
        response = validate_routing_response(
            {
                "top_candidates": [
                    {
                        "building_block_id": "bb1",
                        "block_id": "BB01",
                        "title": "Flow A",
                        "confidence": "high",
                        "reasoning": "Strong result_code match.",
                    }
                ],
                "routing_summary": "Matched Flow A.",
                "pipeline_run_id": "run-1",
            }
        )

        self.assertEqual(response["top_candidates"][0]["confidence"], "high")

    def test_validate_routing_response_rejects_invalid_confidence(self):
        with self.assertRaises(PipelineResponseValidationError):
            validate_routing_response(
                {
                    "top_candidates": [
                        {
                            "building_block_id": "bb1",
                            "block_id": "BB01",
                            "title": "Flow A",
                            "confidence": "very high",
                            "reasoning": "Invalid confidence.",
                        }
                    ],
                    "routing_summary": "Matched Flow A.",
                    "pipeline_run_id": "run-1",
                }
            )

    def test_validate_evaluation_response_accepts_confirmed_shape(self):
        response = validate_evaluation_response(
            {
                "building_block_confirmed": True,
                "building_block_id": "bb1",
                "block_id": "BB01",
                "building_block_confirmation_reasoning": "Correct domain.",
                "frame_passed": True,
                "frame_reasoning": "All steps present.",
                "missing_canonical_steps": [],
                "currency_passed": False,
                "currency_reasoning": "Latest BA action missing.",
                "stale_evidence": ["Missing Action C."],
                "pipeline_run_id": "run-1",
            }
        )

        self.assertTrue(response["building_block_confirmed"])
        self.assertFalse(response["currency_passed"])

    def test_validate_evaluation_response_rejects_confirmed_null_booleans(self):
        with self.assertRaises(PipelineResponseValidationError):
            validate_evaluation_response(
                {
                    "building_block_confirmed": True,
                    "building_block_id": "bb1",
                    "block_id": "BB01",
                    "building_block_confirmation_reasoning": "Correct domain.",
                    "frame_passed": None,
                    "frame_reasoning": None,
                    "missing_canonical_steps": [],
                    "currency_passed": True,
                    "currency_reasoning": "OK.",
                    "stale_evidence": [],
                    "pipeline_run_id": "run-1",
                }
            )

    def test_validate_evaluation_response_accepts_confirmed_null_currency(self):
        response = validate_evaluation_response(
            {
                "building_block_confirmed": True,
                "building_block_id": "bb1",
                "block_id": "BB01",
                "building_block_confirmation_reasoning": "Correct domain.",
                "frame_passed": True,
                "frame_reasoning": "All steps present.",
                "missing_canonical_steps": [],
                "currency_passed": None,
                "currency_reasoning": "BA rules were not provided.",
                "stale_evidence": [],
                "pipeline_run_id": "run-1",
            }
        )

        self.assertIsNone(response["currency_passed"])

    def test_validate_evaluation_response_coerces_string_booleans(self):
        response = validate_evaluation_response(
            {
                "building_block_confirmed": "true",
                "building_block_id": "bb1",
                "block_id": "BB01",
                "building_block_confirmation_reasoning": "Correct domain.",
                "frame_passed": "true",
                "frame_reasoning": "All steps present.",
                "missing_canonical_steps": [],
                "currency_passed": None,
                "currency_reasoning": "BA rules were not provided.",
                "stale_evidence": [],
                "pipeline_run_id": "run-1",
            }
        )

        self.assertTrue(response["building_block_confirmed"])
        self.assertTrue(response["frame_passed"])
        self.assertIsNone(response["currency_passed"])


if __name__ == "__main__":
    unittest.main()
