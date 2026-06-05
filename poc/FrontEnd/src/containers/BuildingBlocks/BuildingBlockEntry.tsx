import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
import "./BuildingBlocks.css";

interface BuildingBlockDetail {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  row_count: number;
  created_at: string;
}

export default function BuildingBlockEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<BuildingBlockDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:3000/api/building-blocks/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setEntry(data);
        pagination.reset();
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const pagination = usePagination(entry?.rows ?? [], 20);
  const { pageItems, startIndex } = pagination;

  return (
    <div>
      <Navbar />

      <div className="bb-entry-header">
        <button className="btn" onClick={() => navigate("/building-blocks")}>← Back</button>
        {entry && (
          <>
            <span className="bb-entry-name">{entry.name}</span>
            <span className="bb-entry-info">
              {entry.row_count} rows · {new Date(entry.created_at).toLocaleString()}
            </span>
          </>
        )}
      </div>

      {error && <p className="bb-error">{error}</p>}

      {entry && (
        <div className="bb-table-wrapper">
          <table className="bb-table">
            <thead>
              <tr>
                {entry.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((row, i) => (
                <tr key={startIndex + i}>
                  {entry.columns.map((col) => (
                    <td key={col}>{row[col] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            startIndex={startIndex}
            perPage={pagination.perPage}
            totalItems={pagination.totalItems}
            onPrev={() => pagination.setPage((p) => p - 1)}
            onNext={() => pagination.setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}
