import json
import unittest

from pipeline.payloads.routing_payload_builder import (
    build_compact_building_blocks,
    build_routing_payload,
    build_routing_ticket_context,
)


class TestRoutingPayloadBuilder(unittest.TestCase):
    def test_build_routing_ticket_context_keeps_only_stated_purpose_fields(self):
        ticket = {
            "jira_ticket_id": "JT-0001",
            "result_code": "RC01",
            "title_raw": "[APP][RC01] Scenario A",
            "steps": [{"step": 1, "action": "Do thing"}],
            "steps_raw": [["Action", "Expected"]],
            "label_hint": "__ANSWER_KEY__",
        }

        context = build_routing_ticket_context(ticket)

        self.assertEqual(context["jira_ticket_id"], "JT-0001")
        self.assertEqual(context["result_code"], "RC01")
        self.assertNotIn("steps", context)
        self.assertNotIn("steps_raw", context)
        self.assertNotIn("label_hint", context)

    def test_build_compact_building_blocks_excludes_canonical_steps(self):
        compact = build_compact_building_blocks(
            [
                {
                    "building_block_id": "bb-doc-1",
                    "block_id": "BB02",
                    "title": "Standard Workflow",
                    "version": "SR4",
                    "routing_rule": "Scenario A cases.",
                    "description": "Standard flow.",
                    "preconditions": ["Scanner online"],
                    "test_steps": [{"step": 1, "action": "Perform action"}],
                }
            ]
        )

        self.assertEqual(compact[0]["block_id"], "BB02")
        self.assertEqual(compact[0]["routing_rule"], "Scenario A cases.")
        self.assertNotIn("preconditions", compact[0])
        self.assertNotIn("test_steps", compact[0])

    def test_build_routing_payload_uses_stringified_inputs(self):
        payload = build_routing_payload(
            pipeline_run_id="run-1",
            project_context_text=" Product-specific context belongs here. ",
            user_prompt_text=" Treat camera as scanner. ",
            ticket={
                "jira_ticket_id": "JT-0001",
                "result_code": "RC01",
                "title_raw": "[APP][RC01] Scenario A",
                "steps": [{"step": 1, "action": "Should not be sent"}],
                "label_hint": "__ANSWER_KEY__",
            },
            building_blocks=[
                {
                    "building_block_id": "bb-doc-1",
                    "block_id": "BB02",
                    "title": "Standard Workflow",
                    "version": "SR4",
                    "routing_rule": "Scenario A cases.",
                    "description": "Standard workflow.",
                    "test_steps": [{"step": 1, "action": "Should not be sent"}],
                }
            ],
        )

        inputs = payload["inputs"]
        ticket_json = json.loads(inputs["ticket_json"])
        bb_candidates_json = json.loads(inputs["bb_candidates_json"])

        self.assertEqual(payload["response_mode"], "blocking")
        self.assertEqual(payload["user"], "aegis")
        self.assertEqual(inputs["pipeline_run_id"], "run-1")
        self.assertEqual(inputs["project_context_text"], "Product-specific context belongs here.")
        self.assertEqual(inputs["user_prompt_text"], "Treat camera as scanner.")
        self.assertIsInstance(inputs["system_prompt"], str)
        self.assertIsInstance(inputs["routing_prompt"], str)
        self.assertIsInstance(inputs["ticket_json"], str)
        self.assertIsInstance(inputs["bb_candidates_json"], str)
        self.assertEqual(ticket_json["result_code"], "RC01")
        self.assertNotIn("steps", ticket_json)
        self.assertEqual(bb_candidates_json[0]["block_id"], "BB02")
        self.assertNotIn("test_steps", bb_candidates_json[0])
        self.assertIn("run-1", inputs["routing_prompt"])
        self.assertIn("PROJECT CONTEXT", inputs["routing_prompt"])
        self.assertNotIn("{{", inputs["routing_prompt"])
        self.assertNotIn("label_hint", json.dumps(payload))
        self.assertNotIn("__ANSWER_KEY__", json.dumps(payload))
        self.assertNoDomainSpecificPromptTerms(payload)

    def assertNoDomainSpecificPromptTerms(self, payload):
        prompt_text = " ".join(
            [
                payload["inputs"]["system_prompt"],
                payload["inputs"]["routing_prompt"],
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
