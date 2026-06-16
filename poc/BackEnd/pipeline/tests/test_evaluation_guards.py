import unittest

from pipeline.evaluators.guards.currency_checker import guard_currency_evaluation
from pipeline.evaluators.guards.frame_checker import guard_frame_evaluation


def base_evaluation(**overrides):
    value = {
        "building_block_confirmed": True,
        "building_block_id": "bb1",
        "block_id": "BB01",
        "building_block_confirmation_reasoning": "Correct domain.",
        "frame_passed": True,
        "frame_reasoning": "All canonical steps present.",
        "missing_canonical_steps": [],
        "currency_passed": True,
        "currency_reasoning": "Latest BA rule reflected.",
        "stale_evidence": [],
        "pipeline_run_id": "run-1",
    }
    value.update(overrides)
    return value


class TestEvaluationGuards(unittest.TestCase):
    def test_frame_guard_fails_when_missing_steps_are_listed(self):
        checked, notes = guard_frame_evaluation(
            base_evaluation(
                frame_passed=True,
                missing_canonical_steps=["Step 3: missing liveness check"],
            )
        )

        self.assertFalse(checked["frame_passed"])
        self.assertIn("frame_passed was true", notes[0])

    def test_frame_guard_adds_evidence_when_frame_fails_without_missing_steps(self):
        checked, notes = guard_frame_evaluation(
            base_evaluation(
                frame_passed=False,
                frame_reasoning="Frame incomplete.",
                missing_canonical_steps=[],
            )
        )

        self.assertFalse(checked["frame_passed"])
        self.assertTrue(checked["missing_canonical_steps"])
        self.assertIn("missing_canonical_steps was empty", notes[0])

    def test_currency_guard_enforces_missing_ba_as_failure(self):
        checked, notes = guard_currency_evaluation(
            evaluation=base_evaluation(currency_passed=True),
            ticket={"result_code": "IR01"},
            ba_context={
                "result_code": "IR01",
                "mapping_status": "not_found",
                "latest_rule": None,
                "historical_rules": [],
            },
        )

        self.assertFalse(checked["currency_passed"])
        self.assertTrue(checked["stale_evidence"])
        self.assertIn("BA mapping was not found", notes[0])

    def test_currency_guard_fails_result_code_mismatch(self):
        checked, notes = guard_currency_evaluation(
            evaluation=base_evaluation(currency_passed=True),
            ticket={"result_code": "IR01"},
            ba_context={
                "result_code": "IR01",
                "mapping_status": "found",
                "latest_rule": {"result_code": "MR01"},
                "historical_rules": [],
            },
        )

        self.assertFalse(checked["currency_passed"])
        self.assertIn("did not match latest BA rule", notes[0])

    def test_currency_guard_fails_when_stale_evidence_is_listed(self):
        checked, notes = guard_currency_evaluation(
            evaluation=base_evaluation(
                currency_passed=True,
                stale_evidence=["Uses old action label."],
            ),
            ticket={"result_code": "IR01"},
            ba_context={
                "result_code": "IR01",
                "mapping_status": "found",
                "latest_rule": {"result_code": "IR01"},
                "historical_rules": [],
            },
        )

        self.assertFalse(checked["currency_passed"])
        self.assertIn("stale_evidence was non-empty", notes[0])


if __name__ == "__main__":
    unittest.main()
