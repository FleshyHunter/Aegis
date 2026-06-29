import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import { fetchBuildingBlockById, type BuildingBlockDetail } from "../../api/api";
import "./BuildingBlocks.css";

export default function BuildingBlockEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<BuildingBlockDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchBuildingBlockById(id)
      .then((data) => {
        setEntry(data);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <div>
      <Navbar />

      <div className="bb-entry-header">
        <button className="btn" onClick={() => navigate("/building-blocks")}>← Back</button>
        {entry && (
          <>
            <span className="bb-entry-name">{entry.name}</span>
            <span className="bb-entry-info">
              {entry.source_type.toUpperCase()} · {formatBytes(entry.size_bytes)} · {new Date(entry.created_at).toLocaleString()}
            </span>
          </>
        )}
      </div>

      {error && <p className="bb-error">{error}</p>}

      {entry && (
        <div className="bb-doc-view">
          <dl className="bb-doc-metadata">
            <div>
              <dt>File name</dt>
              <dd>{entry.file_name}</dd>
            </div>
            <div>
              <dt>Document type</dt>
              <dd>{entry.source_type.toUpperCase()}</dd>
            </div>
          </dl>
          <div className="bb-doc-placeholder">
            {entry.preview_status === "ready" ? (
              <pre className="bb-doc-preview-text">{entry.preview_text}</pre>
            ) : (
              <span>{entry.preview_error || "Document preview is not available."}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
