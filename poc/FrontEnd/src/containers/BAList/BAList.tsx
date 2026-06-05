import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsEye, BsTrash } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import "./BAList.css";

interface BAListEntry {
  id: string;
  name: string;
  created_at: string;
}

interface Row {
  [key: string]: string;
}

function parseCSV(text: string): Row[] {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines
    .filter((l) => l.trim())
    .map((line) => {
      const values = line.split(",");
      return headers.reduce((row: Row, h, i) => {
        row[h] = values[i]?.trim() ?? "";
        return row;
      }, {});
    });
}

export default function BAList() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<BAListEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/ba-lists")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setError("Failed to load BA lists."));
  }, []);

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const res = await fetch("http://localhost:3000/api/ba-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, rows }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const saved = await res.json();
      setEntries((prev) => [saved, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this BA rule set?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/ba-lists/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const filteredEntries = entries.filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar />

      <div className="ba-toolbar">
        <div className="ba-toolbar-left">
          <input
            className="ba-search"
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ba-toolbar-right">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <button className="btn" disabled={importing} onClick={() => fileRef.current?.click()}>
            {importing ? "Importing..." : "Import BA Rules"}
          </button>
        </div>
      </div>

      {error && <p className="ba-error">{error}</p>}

      {!filteredEntries.length ? (
        <p className="ba-table-status">
          {entries.length ? "No matches found." : "No BA rule sets imported yet."}
        </p>
      ) : (
        <div className="ba-table-wrapper">
          <table className="ba-table ba-list-table">
            <thead>
              <tr>
                <th>Date Added</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                  <td
                    className="ba-name-link"
                    onClick={() => navigate(`/ba/${entry.id}`, { state: entry })}
                  >
                    {entry.name}
                  </td>
                  <td>
                    <div className="ba-actions">
                      <button
                        className="ba-icon-btn"
                        title="View"
                        onClick={() => navigate(`/ba/${entry.id}`, { state: entry })}
                      >
                        <BsEye />
                      </button>
                      <button
                        className="ba-icon-btn ba-icon-danger"
                        title="Delete"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <BsTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
