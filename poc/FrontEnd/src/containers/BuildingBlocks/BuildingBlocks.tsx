import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { BsEye, BsPencil, BsTrash } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import { usePopup } from "../../components/PopUp/PopupContext";
import type { EntrySummary } from "../../components/EntryView/EntrySummary.ts";
import "./BuildingBlocks.css";

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

export default function BuildingBlocks() {
  const navigate = useNavigate();
  const { confirm, prompt } = usePopup();
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/building-blocks")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setError("Failed to load building blocks."));
  }, []);

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const res = await fetch("http://localhost:3000/api/building-blocks", {
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
    const ok = await confirm({
      title: "Delete building block set",
      message: "Are you sure you want to delete this building block set? This cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`http://localhost:3000/api/building-blocks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function handleRename(entry: EntrySummary) {
    const nextName = await prompt({
      title: "Rename building block set",
      message: "Enter a new name for this building block set.",
      confirmText: "Save",
      defaultValue: entry.name,
      placeholder: "Building block set name",
    });

    if (nextName === null) return;
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === entry.name) return;

    try {
      const res = await fetch(`http://localhost:3000/api/building-blocks/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const updated = await res.json();
      setEntries((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, name: updated.name } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed.");
    }
  }

  const filteredEntries = entries.filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar />

      <div className="bb-toolbar">
        <div className="bb-toolbar-left">
          <input
            className="bb-search"
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bb-toolbar-right">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <button className="btn" disabled={importing} onClick={() => fileRef.current?.click()}>
            {importing ? "Importing..." : "Import Building Blocks"}
          </button>
        </div>
      </div>

      {error && <p className="bb-error">{error}</p>}

      {!filteredEntries.length ? (
        <p className="bb-table-status">
          {entries.length ? "No matches found." : "No building block sets imported yet."}
        </p>
      ) : (
        <div className="bb-table-wrapper">
          <table className="bb-table bb-list-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date Added</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td
                    className="bb-name-link"
                    onClick={() => navigate(`/building-blocks/${entry.id}`, { state: entry })}
                  >
                    {entry.name}
                  </td>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                  <td>
                    <div className="bb-actions">
                      <button
                        className="bb-icon-btn"
                        title="View"
                        onClick={() => navigate(`/building-blocks/${entry.id}`, { state: entry })}
                      >
                        <BsEye />
                      </button>
                      <button
                        className="bb-icon-btn"
                        title="Edit name"
                        onClick={() => handleRename(entry)}
                      >
                        <BsPencil />
                      </button>
                      <button
                        className="bb-icon-btn bb-icon-danger"
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
