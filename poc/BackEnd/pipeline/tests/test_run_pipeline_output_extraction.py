import unittest

from pipeline.run_pipeline import _extract_result


class TestRunPipelineOutputExtraction(unittest.TestCase):
    def test_extract_result_unwraps_dify_structured_output(self):
        result = _extract_result(
            {
                "result": {
                    "text": "{}",
                    "structured_output": {
                        "building_block_confirmed": True,
                        "building_block_id": "bb1",
                    },
                }
            }
        )

        self.assertTrue(result["building_block_confirmed"])
        self.assertEqual(result["building_block_id"], "bb1")

    def test_extract_result_unwraps_json_string_result(self):
        result = _extract_result(
            {
                "result": (
                    '{"top_candidates":[],"routing_summary":"No match",'
                    '"pipeline_run_id":"run-1"}'
                )
            }
        )

        self.assertEqual(result["pipeline_run_id"], "run-1")


if __name__ == "__main__":
    unittest.main()
