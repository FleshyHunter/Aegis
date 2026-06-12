import json
import unittest
import urllib.error
from unittest.mock import patch

from pipeline.clients.dify_client import (
    DifyClient,
    DifyClientError,
    MockDifyClient,
    extract_outputs,
)
from pipeline.config import DifyConfig, PipelineConfigError


class FakeResponse:
    def __init__(self, body):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return json.dumps(self.body).encode("utf-8")

    def close(self):
        pass


class TestDifyClient(unittest.TestCase):
    def test_config_reads_dify_env(self):
        with patch.dict(
            "os.environ",
            {
                "DIFY_BASE_URL": "https://example.test/v1/",
                "DIFY_API_KEY": "secret",
                "DIFY_TIMEOUT_SECONDS": "15",
                "DIFY_RESPONSE_MODE": "blocking",
                "DIFY_USER": "aegis-test",
            },
            clear=True,
        ):
            config = DifyConfig.from_env()

        self.assertEqual(config.base_url, "https://example.test/v1")
        self.assertEqual(config.api_key, "secret")
        self.assertEqual(config.timeout_seconds, 15)
        self.assertEqual(config.response_mode, "blocking")
        self.assertEqual(config.user, "aegis-test")

    def test_config_can_fallback_to_legacy_llm_env_names(self):
        with patch.dict(
            "os.environ",
            {
                "LLM_BASE_URL": "https://legacy.test/v1",
                "LLM_API_KEY": "legacy-secret",
                "LLM_TIMEOUT": "20",
            },
            clear=True,
        ):
            config = DifyConfig.from_env()

        self.assertEqual(config.base_url, "https://legacy.test/v1")
        self.assertEqual(config.api_key, "legacy-secret")
        self.assertEqual(config.timeout_seconds, 20)

    def test_config_requires_api_key(self):
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaises(PipelineConfigError):
                DifyConfig.from_env()

    def test_run_workflow_posts_payload_and_returns_json(self):
        client = DifyClient(
            DifyConfig(
                base_url="https://api.test/v1",
                api_key="secret",
                timeout_seconds=7,
            )
        )
        payload = {
            "inputs": {"ticket": {"jira_ticket_id": "JT-0001"}},
        }

        with patch(
            "urllib.request.urlopen",
            return_value=FakeResponse({"data": {"outputs": {"frame": {"passed": True}}}}),
        ) as urlopen:
            response = client.run_workflow(payload)

        request = urlopen.call_args.args[0]
        sent_payload = json.loads(request.data.decode("utf-8"))

        self.assertEqual(response["data"]["outputs"]["frame"]["passed"], True)
        self.assertEqual(request.full_url, "https://api.test/v1/workflows/run")
        self.assertEqual(request.headers["Authorization"], "Bearer secret")
        self.assertEqual(sent_payload["response_mode"], "blocking")
        self.assertEqual(sent_payload["user"], "aegis-poc")
        self.assertEqual(sent_payload["inputs"]["ticket"]["jira_ticket_id"], "JT-0001")
        self.assertEqual(urlopen.call_args.kwargs["timeout"], 7)

    def test_run_workflow_rejects_payload_without_inputs(self):
        client = DifyClient(DifyConfig(base_url="https://api.test/v1", api_key="secret"))

        with self.assertRaises(DifyClientError):
            client.run_workflow({"response_mode": "blocking"})

    def test_run_workflow_rejects_forbidden_label_hint_key(self):
        client = DifyClient(DifyConfig(base_url="https://api.test/v1", api_key="secret"))

        with self.assertRaises(DifyClientError):
            client.run_workflow(
                {
                    "inputs": {
                        "ticket": {
                            "jira_ticket_id": "JT-0001",
                            "label_hint": "Pass",
                        }
                    }
                }
            )

    def test_run_workflow_wraps_http_error(self):
        client = DifyClient(DifyConfig(base_url="https://api.test/v1", api_key="secret"))
        error = urllib.error.HTTPError(
            url="https://api.test/v1/workflows/run",
            code=401,
            msg="Unauthorized",
            hdrs=None,
            fp=FakeResponse({"error": "bad token"}),
        )

        with patch("urllib.request.urlopen", side_effect=error):
            with self.assertRaises(DifyClientError) as context:
                client.run_workflow({"inputs": {}})

        self.assertIn("HTTP 401", str(context.exception))

    def test_extract_outputs_validates_response_shape(self):
        outputs = extract_outputs({"data": {"outputs": {"currency": {"passed": True}}}})

        self.assertEqual(outputs["currency"]["passed"], True)

        with self.assertRaises(DifyClientError):
            extract_outputs({"data": {"outputs": []}})

        with self.assertRaises(DifyClientError):
            extract_outputs({"unexpected": True})

    def test_mock_dify_client_returns_expected_output_shape(self):
        outputs = MockDifyClient().run_workflow_outputs({"inputs": {}})

        self.assertIn("building_block", outputs)
        self.assertIn("frame", outputs)
        self.assertIn("currency", outputs)


if __name__ == "__main__":
    unittest.main()
