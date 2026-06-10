import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import "./TicketSets.css";

interface TicketSetDetail {
  id: string;
  name: string;
  source_filename: string;
  source_type: string;
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
      })
      .catch((err) => setError(err.message));
  }, [id]);

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
        <div className="ts-detail-panel">
          <dl className="ts-detail-grid">
            <div>
              <dt>Name</dt>
              <dd>{entry.name}</dd>
            </div>
            <div>
              <dt>Source filename</dt>
              <dd>{entry.source_filename || "—"}</dd>
            </div>
            <div>
              <dt>Source type</dt>
              <dd>{entry.source_type}</dd>
            </div>
            <div>
              <dt>Row count</dt>
              <dd>{entry.row_count}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
