import "./Pagination.css";

interface Props {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  perPage: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  startIndex,
  perPage,
  totalItems,
  onPrev,
  onNext,
}: Props) {
  if (totalItems === 0) return null;

  return (
    <div className="pagination">
      <span className="pagination-info">
        {startIndex + 1}–{Math.min(startIndex + perPage, totalItems)} of {totalItems}
      </span>
      <div className="pagination-actions">
        <button className="btn" disabled={currentPage <= 1} onClick={onPrev}>
          Previous
        </button>
        <button className="btn" disabled={currentPage >= totalPages} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
