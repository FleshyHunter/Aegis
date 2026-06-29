import { useState } from "react";

export function usePagination<T>(items: T[], perPage = 20) {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const pageItems = items.slice(startIndex, startIndex + perPage);

  function reset() {
    setPage(1);
  }

  return {
    pageItems,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    perPage,
    setPage,
    reset,
  };
}
