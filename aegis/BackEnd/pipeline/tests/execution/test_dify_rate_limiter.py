import time
import unittest

from pipeline.execution.rate_limiter import DifyRateLimiter


class DummyClient:
    def __init__(self):
        self.calls = 0

    def run_workflow_outputs(self, payload):
        self.calls += 1
        return {"result": payload}


class TestDifyRateLimiter(unittest.TestCase):
    def test_disabled_limiter_does_not_delay(self):
        client = DummyClient()
        limiter = DifyRateLimiter(rpm=1, enabled=False)
        started = time.monotonic()

        limiter.run(client, {"ok": True})
        limiter.run(client, {"ok": True})

        self.assertEqual(client.calls, 2)
        self.assertLess(time.monotonic() - started, 0.1)

    def test_enabled_limiter_enforces_minimum_interval(self):
        client = DummyClient()
        limiter = DifyRateLimiter(rpm=600, enabled=True)
        started = time.monotonic()

        limiter.run(client, {"ok": True})
        limiter.run(client, {"ok": True})

        self.assertEqual(client.calls, 2)
        self.assertGreaterEqual(time.monotonic() - started, 0.09)


if __name__ == "__main__":
    unittest.main()
