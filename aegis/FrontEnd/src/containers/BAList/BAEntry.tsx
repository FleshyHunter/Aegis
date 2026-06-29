import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import { fetchBAListById, type BAListDetail } from "../../api/api";
import "./BAList.css";

export default function BAEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<BAListDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchBAListById(id)
      .then(setEntry)
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <div>
      <Navbar />

      <div className="ba-entry-header">
        <button className="btn" onClick={() => navigate("/ba")}>← Back</button>
        {entry && (
          <>
            <span className="ba-entry-name">{entry.name}</span>
            <span className="ba-entry-info">{entry.row_count} rows · {new Date(entry.created_at).toLocaleString()}</span>
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
              {entry.rows.map((row, i) => (
                <tr key={i}>
                  {entry.columns.map((col) => (
                    <td key={col}>{row[col] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
    </div>
  );
}
