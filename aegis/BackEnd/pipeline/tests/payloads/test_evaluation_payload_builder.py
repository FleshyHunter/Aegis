import json
import unittest

from pipeline.payloads.evaluation_payload_builder import build_evaluation_payload


class TestEvaluationPayloadBuilder(unittest.TestCase):
    def test_build_evaluation_payload_uses_full_selected_bb_and_string_inputs(self):
        payload = build_evaluation_payload(
            pipeline_run_id="run-1",
            project_context_text=" Product-specific context belongs here. ",
            user_prompt_text=" Treat flagging as equivalent to escalation. ",
            ticket={
                "jira_ticket_id": "JT-0001",
                "result_code": "RC01",
                "steps": [{"step": 1, "action": "Perform action", "expected": ["1.1 Ready"]}],
                "label_hint": "__ANSWER_KEY__",
            },
            ba_context={
                "result_code": "RC01",
                "mapping_status": "found",
                "latest_rule": {
                    "ba_rule_id": "BA-0002",
                    "release": "SR4",
                    "result_code": "RC01",
                    "action_labels": ["Action A", "Action B", "Action C"],
                },
            },
            building_block={
                "building_block_id": "bb-doc-1",
                "block_id": "BB02",
                "title": "Standard Workflow",
                "version": "SR4",
                "routing_rule": "Scenario A cases.",
                "description": "Standard flow.",
                "preconditions": ["Scanner online"],
                "test_steps": [{"step": 1, "action": "Perform action", "expected": ["1.1 Ready"]}],
            },
        )

        inputs = payload["inputs"]
        ticket_json = json.loads(inputs["ticket_json"])
        ba_context_json = json.loads(inputs["ba_context_json"])
        building_block_json = json.loads(inputs["building_block_json"])

        self.assertEqual(payload["response_mode"], "blocking")
        self.assertEqual(payload["user"], "aegis")
        self.assertEqual(inputs["pipeline_run_id"], "run-1")
        self.assertEqual(
            inputs["project_context_text"],
            "Product-specific context belongs here.",
        )
        self.assertEqual(
            inputs["user_prompt_text"],
            "Treat flagging as equivalent to escalation.",
        )
        self.assertIsInstance(inputs["system_prompt"], str)
        self.assertIsInstance(inputs["evaluation_prompt"], str)
        self.assertIsInstance(inputs["ticket_json"], str)
        self.assertIsInstance(inputs["ba_context_json"], str)
        self.assertIsInstance(inputs["building_block_json"], str)
        self.assertEqual(ticket_json["result_code"], "RC01")
        self.assertEqual(ba_context_json["latest_rule"]["release"], "SR4")
        self.assertEqual(building_block_json["block_id"], "BB02")
        self.assertIn("test_steps", building_block_json)
        self.assertIn("run-1", inputs["evaluation_prompt"])
        self.assertIn("PROJECT CONTEXT", inputs["evaluation_prompt"])
        self.assertNotIn("{{", inputs["evaluation_prompt"])
        self.assertNotIn("label_hint", json.dumps(payload))
        self.assertNotIn("__ANSWER_KEY__", json.dumps(payload))
        self.assertNoDomainSpecificPromptTerms(payload)

    def test_build_evaluation_payload_keeps_missing_ba_mapping_context(self):
        payload = build_evaluation_payload(
            ticket={"jira_ticket_id": "JT-0002", "result_code": "BAD99"},
            ba_context={
                "result_code": "BAD99",
                "mapping_status": "not_found",
                "latest_rule": None,
                "historical_rules": [],
            },
            building_block={"block_id": "BB02", "test_steps": []},
        )

        ba_context_json = json.loads(payload["inputs"]["ba_context_json"])

        self.assertEqual(ba_context_json["mapping_status"], "not_found")
        self.assertIsNone(ba_context_json["latest_rule"])
        self.assertIn("mapping_status is not_found", payload["inputs"]["evaluation_prompt"])

    def assertNoDomainSpecificPromptTerms(self, payload):
        prompt_text = " ".join(
            [
                payload["inputs"]["system_prompt"],
                payload["inputs"]["evaluation_prompt"],
            ]
        ).lower()
        forbidden_terms = [
            "biometric",
            "border",
            "gantry",
            "iris",
            "liveness",
            "mrz",
            "passport",
            "profiler",
            "spoof",
        ]

        for term in forbidden_terms:
            self.assertNotIn(term, prompt_text)


if __name__ == "__main__":
    unittest.main()
