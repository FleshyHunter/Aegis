import json
import unittest

from pipeline.payloads.payload_utils import (
    build_ba_context_for_ticket,
    build_dify_envelope,
    json_for_dify,
    strip_forbidden_keys,
)


class TestPayloadUtils(unittest.TestCase):
    def test_build_dify_envelope_contains_common_request_shape(self):
        payload = build_dify_envelope(
            inputs={
                "pipeline_run_id": "run-1",
                "project_context_text": "Stable product context.",
                "user_prompt_text": "Treat flagging as escalation.",
                "ticket_json": "{\"jira_ticket_id\":\"JT-0001\"}",
            }
        )

        self.assertEqual(payload["response_mode"], "blocking")
        self.assertEqual(payload["user"], "aegis-poc")
        self.assertEqual(payload["inputs"]["pipeline_run_id"], "run-1")
        self.assertEqual(
            payload["inputs"]["project_context_text"],
            "Stable product context.",
        )
        self.assertEqual(
            payload["inputs"]["user_prompt_text"],
            "Treat flagging as escalation.",
        )

    def test_payload_removes_label_hint_recursively(self):
        payload = build_dify_envelope(
            inputs={
                "jira_ticket_id": "JT-0001",
                "label_hint": "__LABEL_HINT_PASS__",
                "nested": {"label_hint": "__LABEL_HINT_FAILED__"},
                "building_blocks": [{"label_hint": "__LABEL_HINT_BB__"}],
            }
        )

        serialized = json.dumps(payload)

        self.assertNotIn("label_hint", serialized)
        self.assertNotIn("__LABEL_HINT_PASS__", serialized)
        self.assertNotIn("__LABEL_HINT_FAILED__", serialized)
        self.assertNotIn("__LABEL_HINT_BB__", serialized)

    def test_strip_forbidden_keys_does_not_mutate_original(self):
        original = {"label_hint": "secret", "nested": {"label_hint": "nested", "keep": "yes"}}

        stripped = strip_forbidden_keys(original)

        self.assertIn("label_hint", original)
        self.assertNotIn("label_hint", stripped)
        self.assertNotIn("label_hint", stripped["nested"])
        self.assertEqual(stripped["nested"]["keep"], "yes")

    def test_json_for_dify_returns_compact_stable_json_without_forbidden_keys(self):
        serialized = json_for_dify({"b": 2, "a": 1, "label_hint": "secret"})

        self.assertEqual(serialized, '{"a":1,"b":2}')

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
        self.assertTrue(context["currency_required"])
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
        self.assertTrue(context["currency_required"])

    def test_build_ba_context_handles_unavailable_ba(self):
        context = build_ba_context_for_ticket(
            normalized_ba={"ba_available": False},
            result_code="IR01",
        )

        self.assertEqual(context["result_code"], "IR01")
        self.assertIsNone(context["latest_rule"])
        self.assertEqual(context["historical_rules"], [])
        self.assertEqual(context["mapping_status"], "unavailable")
        self.assertFalse(context["currency_required"])

if __name__ == "__main__":
    unittest.main()
