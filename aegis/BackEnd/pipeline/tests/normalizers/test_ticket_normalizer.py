import unittest

from pipeline.normalizers.ticket_normalizer import (
    normalize_ticket_row,
    normalize_ticket_table,
    normalize_tickets,
)


DERIVED_ROW = {
    "jira_ticket_id": " JT-0001 ",
    "test_case_id": "TC-0001",
    "title_raw": "[ICS][IR01][Iris][Mismatch] Iris Mismatch",
    "product_name": "ICS",
    "title_brackets": ["ICS", "IR01", "Iris", "Mismatch"],
    "result_code": "ir01",
    "result_code_source": "title_brackets[1]",
    "title_convention_status": "standard",
    "title_parse_warnings": [],
    "test_case_name": "Iris Mismatch",
    "components": ["Iris Scanner", "Biometric Verification"],
    "labels": ["ICS", "IR01", "Iris", "Mismatch"],
    "fix_versions": ["ICS SR4"],
    "description_context": "Verify iris mismatch raises IR01.",
    "preconditions": [
        "ICS gantry is powered on and operational",
        "Officer iPad is connected and active",
    ],
    "steps_raw": [
        [
            "Launch the ICS application",
            "1.1 Iris verification interface is displayed",
        ]
    ],
    "steps": [
        {
            "step": 1,
            "action": "Launch the ICS application",
            "expected": [
                "1.1 Iris verification interface is displayed",
                "1.2 Camera status shows Ready",
            ],
        }
    ],
    "label_hint": "Pass",
    "routing_key": None,
}


class TestTicketNormalizer(unittest.TestCase):
    def test_normalize_ticket_row_keeps_dify_allowed_fields(self):
        normalized = normalize_ticket_row(DERIVED_ROW, index=0)

        self.assertEqual(normalized["derived_test_case_id"], "DTC-0001")
        self.assertEqual(normalized["jira_ticket_id"], "JT-0001")
        self.assertEqual(normalized["test_case_id"], "TC-0001")
        self.assertEqual(normalized["title_raw"], "[ICS][IR01][Iris][Mismatch] Iris Mismatch")
        self.assertEqual(normalized["product_name"], "ICS")
        self.assertEqual(normalized["title_brackets"], ["ICS", "IR01", "Iris", "Mismatch"])
        self.assertEqual(normalized["result_code"], "IR01")
        self.assertEqual(normalized["result_code_source"], "title_brackets[1]")
        self.assertEqual(normalized["title_convention_status"], "standard")
        self.assertEqual(normalized["test_case_name"], "Iris Mismatch")
        self.assertEqual(normalized["components"], ["Iris Scanner", "Biometric Verification"])
        self.assertEqual(normalized["labels"], ["ICS", "IR01", "Iris", "Mismatch"])
        self.assertEqual(normalized["fix_versions"], ["ICS SR4"])
        self.assertEqual(normalized["description_context"], "Verify iris mismatch raises IR01.")
        self.assertEqual(
            normalized["preconditions"],
            [
                "ICS gantry is powered on and operational",
                "Officer iPad is connected and active",
            ],
        )
        self.assertEqual(
            normalized["steps"],
            [
                {
                    "step": 1,
                    "action": "Launch the ICS application",
                    "expected": [
                        "1.1 Iris verification interface is displayed",
                        "1.2 Camera status shows Ready",
                    ],
                }
            ],
        )

    def test_label_hint_and_steps_raw_are_excluded_from_normalized_ticket(self):
        normalized = normalize_ticket_row(DERIVED_ROW)

        self.assertNotIn("label_hint", normalized)
        self.assertNotIn("steps_raw", normalized)

    def test_csv_like_string_lists_are_split(self):
        row = {
            "components": "Iris Scanner, Biometric Verification",
            "labels": "ICS, IR01, Iris",
            "fix_versions": "ICS SR4, ICS SR5",
        }

        normalized = normalize_ticket_row(row)

        self.assertEqual(normalized["components"], ["Iris Scanner", "Biometric Verification"])
        self.assertEqual(normalized["labels"], ["ICS", "IR01", "Iris"])
        self.assertEqual(normalized["fix_versions"], ["ICS SR4", "ICS SR5"])

    def test_invalid_enum_values_fall_back_to_safe_defaults(self):
        normalized = normalize_ticket_row(
            {
                "result_code_source": "somewhere_else",
                "title_convention_status": "weird",
            }
        )

        self.assertEqual(normalized["result_code_source"], "not_found")
        self.assertEqual(normalized["title_convention_status"], "invalid")

    def test_steps_are_normalized_and_bad_step_rows_are_ignored(self):
        normalized = normalize_ticket_row(
            {
                "steps": [
                    {
                        "step": "2",
                        "action": "Verify exception notification",
                        "expected": "2.1 IR01 displayed, 2.2 Orange colour shown",
                    },
                    "not-a-step-object",
                    {
                        "action": "Verify action buttons",
                        "expected": ["3.1 Override Scan displayed", ""],
                    },
                ]
            }
        )

        self.assertEqual(
            normalized["steps"],
            [
                {
                    "step": 2,
                    "action": "Verify exception notification",
                    "expected": ["2.1 IR01 displayed", "2.2 Orange colour shown"],
                },
                {
                    "step": 3,
                    "action": "Verify action buttons",
                    "expected": ["3.1 Override Scan displayed"],
                },
            ],
        )

    def test_normalize_ticket_table_wraps_normalized_rows(self):
        table = {
            "id": "derived-table-1",
            "ticket_set_id": "ticket-set-1",
            "raw_test_case_id": "raw-table-1",
            "name": "Ticket Set derived",
            "source_filename": "tickets.csv",
            "rows": [DERIVED_ROW, "bad-row"],
        }

        normalized = normalize_ticket_table(table)

        self.assertEqual(normalized["derived_test_case_table_id"], "derived-table-1")
        self.assertEqual(normalized["ticket_set_id"], "ticket-set-1")
        self.assertEqual(normalized["raw_test_case_id"], "raw-table-1")
        self.assertEqual(normalized["name"], "Ticket Set derived")
        self.assertEqual(normalized["source_filename"], "tickets.csv")
        self.assertEqual(normalized["ticket_count"], 1)
        self.assertEqual(len(normalized["tickets"]), 1)
        self.assertNotIn("label_hint", normalized["tickets"][0])

    def test_normalize_tickets_returns_only_ticket_rows(self):
        tickets = normalize_tickets({"rows": [DERIVED_ROW]})

        self.assertEqual(len(tickets), 1)
        self.assertEqual(tickets[0]["jira_ticket_id"], "JT-0001")

    def test_normalize_ticket_table_rejects_non_list_rows(self):
        with self.assertRaises(ValueError):
            normalize_ticket_table({"rows": "not-a-list"})


if __name__ == "__main__":
    unittest.main()
