import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsEye, BsPencil, BsTrash } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import { usePopup } from "../../components/PopUp/PopupContext";
import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
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
  const { confirm, prompt } = usePopup();
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
    const ok = await confirm({
      title: "Delete BA rule set",
      message: "Are you sure you want to delete this BA rule set? This cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
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

  async function handleRename(entry: BAListEntry) {
    const nextName = await prompt({
      title: "Rename BA rule set",
      message: "Enter a new name for this BA rule set.",
      confirmText: "Save",
      defaultValue: entry.name,
      placeholder: "BA rule set name",
    });

    if (nextName === null) return;
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === entry.name) return;

    try {
      const res = await fetch(`http://localhost:3000/api/ba-lists/${entry.id}`, {
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

  const pagination = usePagination(filteredEntries, 20);

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
                <th>Name</th>
                <th>Date Added</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((entry) => (
                <tr key={entry.id}>
                  <td
                    className="ba-name-link"
                    onClick={() => navigate(`/ba/${entry.id}`, { state: entry })}
                  >
                    {entry.name}
                  </td>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
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
                        className="ba-icon-btn"
                        title="Edit name"
                        onClick={() => handleRename(entry)}
                      >
                        <BsPencil />
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
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            startIndex={pagination.startIndex}
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
