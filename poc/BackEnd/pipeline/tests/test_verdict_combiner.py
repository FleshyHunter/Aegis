import unittest

from pipeline.evaluators.verdict.verdict_combiner import (
    build_final_reasoning,
    combine_final_classification,
)


class TestVerdictCombiner(unittest.TestCase):
    def test_skips_when_no_building_block_confirmed(self):
        evaluation = {
            "building_block_confirmed": False,
            "building_block_confirmation_reasoning": "Wrong domain.",
        }

        self.assertEqual(combine_final_classification(evaluation), "Skipped")
        self.assertEqual(build_final_reasoning(evaluation), "Wrong domain.")

    def test_fails_when_frame_or_currency_fails(self):
        self.assertEqual(
            combine_final_classification(
                {
                    "building_block_confirmed": True,
                    "frame_passed": False,
                    "currency_passed": True,
                }
            ),
            "Failed",
        )
        self.assertEqual(
            combine_final_classification(
                {
                    "building_block_confirmed": True,
                    "frame_passed": True,
                    "currency_passed": False,
                }
            ),
            "Failed",
        )

    def test_passes_when_frame_and_currency_pass(self):
        evaluation = {
            "building_block_confirmed": True,
            "frame_passed": True,
            "currency_passed": True,
        }

        self.assertEqual(combine_final_classification(evaluation), "Pass")
        self.assertEqual(
            build_final_reasoning(evaluation),
            "Frame conformance and requirement currency both passed.",
        )


if __name__ == "__main__":
    unittest.main()
