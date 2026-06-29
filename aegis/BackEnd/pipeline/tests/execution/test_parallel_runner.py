import time
import unittest

from pipeline.execution.parallel_runner import run_ordered_parallel


class TestParallelRunner(unittest.TestCase):
    def test_preserves_input_order_when_tasks_finish_out_of_order(self):
        def worker(value):
            time.sleep((4 - value) * 0.01)
            return value * 10

        results = run_ordered_parallel(
            items=[1, 2, 3],
            worker=worker,
            max_workers=3,
        )

        self.assertEqual(results, [10, 20, 30])

    def test_uses_sequential_path_when_max_workers_is_one(self):
        seen = []

        def worker(value):
            seen.append(value)
            return value

        results = run_ordered_parallel(
            items=[1, 2, 3],
            worker=worker,
            max_workers=1,
        )

        self.assertEqual(results, [1, 2, 3])
        self.assertEqual(seen, [1, 2, 3])

    def test_raises_worker_exception(self):
        def worker(value):
            if value == 2:
                raise ValueError("bad item")
            return value

        with self.assertRaisesRegex(ValueError, "bad item"):
            run_ordered_parallel(
                items=[1, 2, 3],
                worker=worker,
                max_workers=2,
            )


if __name__ == "__main__":
    unittest.main()
