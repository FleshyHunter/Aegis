"""Ordered parallel execution helpers for pipeline batch work."""

from __future__ import annotations

from concurrent.futures import FIRST_EXCEPTION, ThreadPoolExecutor, wait
from typing import Callable, Sequence, TypeVar, cast


T = TypeVar("T")
R = TypeVar("R")


def run_ordered_parallel(
    *,
    items: Sequence[T],
    worker: Callable[[T], R],
    max_workers: int,
) -> list[R]:
    """Run work concurrently while returning results in the original item order.

    If any worker fails, the first exception is raised and pending work is
    cancelled where possible. This keeps the pipeline fail-fast for debugging.
    """

    item_list = list(items)
    if not item_list:
        return []

    worker_count = max(1, min(max_workers, len(item_list)))
    if worker_count == 1:
        return [worker(item) for item in item_list]

    results: list[R | None] = [None] * len(item_list)
    executor = ThreadPoolExecutor(max_workers=worker_count)
    futures = {
        executor.submit(worker, item): index
        for index, item in enumerate(item_list)
    }

    try:
        done, pending = wait(futures, return_when=FIRST_EXCEPTION)
        failed_exception = next(
            (future.exception() for future in done if future.exception() is not None),
            None,
        )
        if failed_exception:
            for future in pending:
                future.cancel()
            raise failed_exception

        for future in done:
            index = futures[future]
            results[index] = future.result()

        done, pending = wait(pending)
        for future in done:
            index = futures[future]
            results[index] = future.result()
    finally:
        executor.shutdown(wait=True, cancel_futures=True)

    return [cast(R, result) for result in results]
