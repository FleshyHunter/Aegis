import json
import unittest

from pipeline.prompts.payload_builder import (
    build_ba_context_for_ticket,
    build_dify_payload,
    build_dify_payloads_for_tickets,
)


class TestPayloadBuilder(unittest.TestCase):
    def test_build_dify_payload_contains_prompt_and_normalized_context(self):
        payload = build_dify_payload(
            pipeline_run_id="run-1",
            user_prompt_text=" Treat spoof flagging as Flag Spoof Attempt. ",
            ticket={
                "jira_ticket_id": "JT-0001",
                "result_code": "IR01",
                "steps": [],
            },
            ba_context={
                "latest_rule": {
                    "ba_rule_id": "BA-0001",
                    "result_code": "IR01",
                }
            },
            building_blocks=[
                {
                    "building_block_id": "bb-doc-1",
                    "block_id": "BB01",
                    "test_steps": [],
                }
            ],
        )

        self.assertEqual(payload["response_mode"], "blocking")
        self.assertEqual(payload["user"], "aegis-poc")
        self.assertEqual(payload["inputs"]["pipeline_run_id"], "run-1")
        self.assertEqual(
            payload["inputs"]["user_prompt_text"],
            "Treat spoof flagging as Flag Spoof Attempt.",
        )
        self.assertIn("system_prompt", payload["inputs"])
        self.assertIn("evaluation_prompt", payload["inputs"])
        self.assertEqual(payload["inputs"]["ticket"]["jira_ticket_id"], "JT-0001")
        self.assertEqual(payload["inputs"]["ba"]["latest_rule"]["result_code"], "IR01")
        self.assertEqual(payload["inputs"]["building_blocks"][0]["block_id"], "BB01")

    def test_payload_removes_label_hint_recursively(self):
        payload = build_dify_payload(
            ticket={
                "jira_ticket_id": "JT-0001",
                "label_hint": "__LABEL_HINT_PASS__",
                "nested": {"label_hint": "__LABEL_HINT_FAILED__"},
            },
            ba_context={
                "latest_rule": {
                    "result_code": "IR01",
                    "label_hint": "__LABEL_HINT_BA__",
                }
            },
            building_blocks=[
                {
                    "block_id": "BB01",
                    "label_hint": "__LABEL_HINT_BB__",
                }
            ],
        )

        serialized = json.dumps(payload)

        self.assertNotIn("label_hint", serialized)
        self.assertNotIn("__LABEL_HINT_PASS__", serialized)
        self.assertNotIn("__LABEL_HINT_FAILED__", serialized)
        self.assertNotIn("__LABEL_HINT_BA__", serialized)
        self.assertNotIn("__LABEL_HINT_BB__", serialized)

    def test_build_ba_context_selects_latest_and_history_by_result_code(self):
        normalized_ba = {
            "rules_by_result_code": {
                "IR01": [
                    {"ba_rule_id": "BA-0001", "release": "SR3", "result_code": "IR01"},
                    {"ba_rule_id": "BA-0002", "release": "SR4", "result_code": "IR01"},
                ]
            },
            "latest_by_result_code": {
                "IR01": {"ba_rule_id": "BA-0002", "release": "SR4", "result_code": "IR01"}
            },
        }

        context = build_ba_context_for_ticket(
            normalized_ba=normalized_ba,
            result_code=" ir01 ",
        )

        self.assertEqual(context["result_code"], "IR01")
        self.assertEqual(context["mapping_status"], "found")
        self.assertEqual(context["latest_rule"]["ba_rule_id"], "BA-0002")
        self.assertEqual(len(context["historical_rules"]), 2)

    def test_build_ba_context_handles_missing_result_code(self):
        context = build_ba_context_for_ticket(
            normalized_ba={},
            result_code=None,
        )

        self.assertIsNone(context["result_code"])
        self.assertIsNone(context["latest_rule"])
        self.assertEqual(context["historical_rules"], [])
        self.assertEqual(context["mapping_status"], "not_found")

    def test_build_dify_payloads_for_tickets_builds_one_payload_per_ticket(self):
        payloads = build_dify_payloads_for_tickets(
            pipeline_run_id="run-1",
            user_prompt_text="Use project-specific synonym.",
            normalized_tickets={
                "tickets": [
                    {"jira_ticket_id": "JT-0001", "result_code": "IR01"},
                    {"jira_ticket_id": "JT-0002", "result_code": "IR02"},
                ]
            },
            normalized_ba={
                "rules_by_result_code": {},
                "latest_by_result_code": {},
            },
            building_blocks=[],
        )

        self.assertEqual(len(payloads), 2)
        self.assertEqual(payloads[0]["inputs"]["ticket"]["jira_ticket_id"], "JT-0001")
        self.assertEqual(payloads[1]["inputs"]["ticket"]["jira_ticket_id"], "JT-0002")

    def test_build_dify_payloads_rejects_missing_ticket_list(self):
        with self.assertRaises(ValueError):
            build_dify_payloads_for_tickets(
                normalized_tickets={"tickets": "not-a-list"},
                normalized_ba={},
                building_blocks=[],
            )


if __name__ == "__main__":
    unittest.main()
