import unittest

from pipeline.prompts.routing_prompt import (
    get_routing_system_prompt,
    render_routing_prompt,
)


class TestRoutingPrompt(unittest.TestCase):
    def test_get_routing_system_prompt_returns_generic_phase_instruction(self):
        prompt = get_routing_system_prompt()

        self.assertIn("ROUTING ONLY", prompt)
        self.assertNotIn("{{", prompt)

    def test_render_routing_prompt_injects_context_and_avoids_template_tokens(self):
        prompt = render_routing_prompt(
            pipeline_run_id="run-1",
            ticket_json='{"result_code":"RC01"}',
            bb_candidates_json='[{"block_id":"BB01"}]',
            project_context_text=" Project context. ",
            user_prompt_text=" Reviewer note. ",
        )

        self.assertIn("run-1", prompt)
        self.assertIn('{"result_code":"RC01"}', prompt)
        self.assertIn('[{"block_id":"BB01"}]', prompt)
        self.assertIn("Project context.", prompt)
        self.assertIn("Reviewer note.", prompt)
        self.assertNotIn("{{", prompt)
        self.assertNotIn("}}", prompt)


if __name__ == "__main__":
    unittest.main()
