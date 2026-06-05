import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
import "./TicketSets.css";

interface TicketSetDetail {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  row_count: number;
  created_at: string;
}

export default function TicketSetEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<TicketSetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:3000/api/ticket-sets/${id}`)
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

      <div className="ts-entry-header">
        <button className="btn" onClick={() => navigate("/ticket-sets")}>← Back</button>
        {entry && (
          <>
            <span className="ts-entry-name">{entry.name}</span>
            <span className="ts-entry-info">
              {entry.row_count} rows · {new Date(entry.created_at).toLocaleString()}
            </span>
          </>
        )}
      </div>

      {error && <p className="ts-error">{error}</p>}

      {entry && (
        <div className="ts-table-wrapper">
          <table className="ts-table">
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
