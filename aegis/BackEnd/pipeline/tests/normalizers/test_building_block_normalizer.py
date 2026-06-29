import unittest

from pipeline.normalizers.building_block_normalizer import (
    normalize_building_block,
    normalize_building_blocks,
)


PREVIEW_TEXT = """BB15 — Risk Profiling Escalation

Block Metadata
Title:  Risk Profiling Escalation
Block ID:  BB15
Version (Release):  SR4

Routing Rule
All test cases that test the risk profiling model output and resulting officer workflow.
Matched when title or description references risk profiling, risk escalation, RP01, or risk flag.

Description (AI Context)
SR4 added the Override Risk Flag action to RP01.
Test cases must verify both the escalation path and officer action outcomes.

Preconditions
Traveller identity and biometric verification has completed
Risk profiling service is online and operational
Officer iPad is connected and active

Test Steps (Canonical Frame)
Step definitions below are the canonical core steps.
test_steps:
[
  {
    "step": 1,
    "action": "System submits traveller data to risk profiling model",
    "expected": [
      "1.1 Risk profiling model initiated",
      "1.2 Traveller biographic, biometric and travel history submitted"
    ]
  },
  {
    "step": 2,
    "action": "Officer receives risk profile escalation on iPad",
    "expected": [
      "2.1 RP01 displayed with Orange colour code",
      "2.2 Flag for Secondary Screening and Override Risk Flag action buttons displayed"
    ]
  }
]
"""


class TestBuildingBlockNormalizer(unittest.TestCase):
    def test_normalize_building_block_extracts_locked_shape(self):
        normalized = normalize_building_block(
            {
                "id": "bb-doc-1",
                "name": "BB15_Risk_Profiling_Escalation.docx",
                "file_name": "BB15_Risk_Profiling_Escalation.docx",
                "preview_text": PREVIEW_TEXT,
            }
        )

        self.assertEqual(normalized["building_block_id"], "bb-doc-1")
        self.assertEqual(normalized["block_id"], "BB15")
        self.assertEqual(normalized["title"], "Risk Profiling Escalation")
        self.assertEqual(normalized["version"], "SR4")
        self.assertIn("risk profiling model output", normalized["routing_rule"])
        self.assertIn("Override Risk Flag", normalized["description"])
        self.assertEqual(
            normalized["preconditions"],
            [
                "Traveller identity and biometric verification has completed",
                "Risk profiling service is online and operational",
                "Officer iPad is connected and active",
            ],
        )
        self.assertEqual(len(normalized["test_steps"]), 2)
        self.assertEqual(normalized["test_steps"][0]["step"], 1)
        self.assertEqual(
            normalized["test_steps"][0]["action"],
            "System submits traveller data to risk profiling model",
        )
        self.assertEqual(
            normalized["test_steps"][0]["expected"],
            [
                "1.1 Risk profiling model initiated",
                "1.2 Traveller biographic, biometric and travel history submitted",
            ],
        )

    def test_title_can_fall_back_to_heading_when_title_label_is_missing(self):
        preview_text = """BB01 — Passport Scanning - Standard

Routing Rule
Passport scanning cases.

test_steps:
[]
"""

        normalized = normalize_building_block(
            {
                "id": "bb-doc-1",
                "name": "BB01_Passport_Scanning_Standard.docx",
                "preview_text": preview_text,
            }
        )

        self.assertEqual(normalized["block_id"], "BB01")
        self.assertEqual(normalized["title"], "Passport Scanning - Standard")

    def test_title_can_fall_back_to_file_name(self):
        normalized = normalize_building_block(
            {
                "id": "bb-doc-1",
                "name": "BB02_Iris_Verification_Standard.docx",
                "preview_text": "test_steps:\n[]",
            }
        )

        self.assertEqual(normalized["title"], "Iris Verification Standard")

    def test_preconditions_strip_bullet_and_number_prefixes(self):
        preview_text = """Preconditions
- Gantry is powered on
* Passport scanner is online
1. Officer iPad is connected

test_steps:
[]
"""

        normalized = normalize_building_block(
            {
                "id": "bb-doc-1",
                "name": "BB01.docx",
                "preview_text": preview_text,
            }
        )

        self.assertEqual(
            normalized["preconditions"],
            [
                "Gantry is powered on",
                "Passport scanner is online",
                "Officer iPad is connected",
            ],
        )

    def test_expected_string_is_split_into_expected_lines(self):
        preview_text = """test_steps:
[
  {
    "step": 1,
    "action": "Read passport chip",
    "expected": "1.1 Chip read started\\n1.2 Chip data returned"
  }
]
"""

        normalized = normalize_building_block(
            {
                "id": "bb-doc-1",
                "name": "BB01.docx",
                "preview_text": preview_text,
            }
        )

        self.assertEqual(
            normalized["test_steps"][0]["expected"],
            ["1.1 Chip read started", "1.2 Chip data returned"],
        )

    def test_missing_test_steps_marker_returns_empty_steps(self):
        normalized = normalize_building_block(
            {
                "id": "bb-doc-1",
                "name": "BB01.docx",
                "preview_text": "Routing Rule\nPassport scanning cases.",
            }
        )

        self.assertEqual(normalized["test_steps"], [])

    def test_invalid_test_steps_json_raises_value_error(self):
        with self.assertRaises(ValueError):
            normalize_building_block(
                {
                    "id": "bb-doc-1",
                    "name": "BB01.docx",
                    "preview_text": 'test_steps:\n[{ "step": 1, "action": "Broken" ',
                }
            )

    def test_normalize_building_blocks_maps_each_item(self):
        normalized = normalize_building_blocks(
            [
                {
                    "id": "bb-doc-1",
                    "name": "BB01_Passport_Scanning.docx",
                    "preview_text": "test_steps:\n[]",
                },
                {
                    "id": "bb-doc-2",
                    "name": "BB02_Iris_Verification.docx",
                    "preview_text": "test_steps:\n[]",
                },
            ]
        )

        self.assertEqual([item["building_block_id"] for item in normalized], ["bb-doc-1", "bb-doc-2"])


if __name__ == "__main__":
    unittest.main()
