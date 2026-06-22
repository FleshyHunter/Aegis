import unittest

from pipeline.run_pipeline import _compact_debug_building_block, _ticket_debug_label


class TestPipelineDebugLogging(unittest.TestCase):
    def test_ticket_debug_label_uses_stable_ticket_identifiers(self):
        self.assertEqual(
            _ticket_debug_label(
                {
                    "jira_ticket_id": "JT-0001",
                    "test_case_id": "TC-0001",
                    "derived_test_case_id": "DTC-0001",
                }
            ),
            "JT-0001 / TC-0001 / DTC-0001",
        )

    def test_ticket_debug_label_handles_missing_identifiers(self):
        self.assertEqual(_ticket_debug_label({}), "unknown ticket")

    def test_compact_debug_building_block_handles_missing_selection(self):
        self.assertEqual(_compact_debug_building_block({}), "not selected yet")


if __name__ == "__main__":
    unittest.main()
