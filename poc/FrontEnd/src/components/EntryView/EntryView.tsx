import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Layout/Navbar";
import "../../containers/BAList/BAList.css";

interface BAEntryDetail {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  row_count: number;
  created_at: string;
}

export default function EntryView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<BAEntryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:3000/api/ba-lists/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setEntry(data);
        setPage(1);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const totalRows = entry?.rows.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageRows = entry?.rows.slice(startIndex, startIndex + rowsPerPage) ?? [];

  return (
    <div>
      <Navbar />

      <div className="ba-entry-header">
        <button className="btn" onClick={() => navigate("/ba")}>← Back</button>
        {entry && (
          <>
            <span className="ba-entry-name">{entry.name}</span>
            <span className="ba-entry-info">
              {entry.row_count} rows · {new Date(entry.created_at).toLocaleString()}
            </span>
          </>
        )}
      </div>

      {error && <p className="ba-error">{error}</p>}

      {entry && (
        <div className="ba-table-wrapper">
          <table className="ba-table">
            <thead>
              <tr>
                {entry.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr key={startIndex + i}>
                  {entry.columns.map((col) => (
                    <td key={col}>{row[col] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ba-pagination">
            <span className="ba-pagination-info">
              {startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalRows)} of {totalRows}
            </span>
            <div className="ba-pagination-actions">
              <button
                className="btn"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button
                className="btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
