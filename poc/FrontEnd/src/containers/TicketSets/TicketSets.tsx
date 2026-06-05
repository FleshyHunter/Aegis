import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsEye, BsPencil, BsTrash } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import { usePopup } from "../../components/PopUp/PopupContext";
import type { EntrySummary } from "../../components/EntryView/EntrySummary.ts";
import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
import "./TicketSets.css";

export default function TicketSets() {
  const navigate = useNavigate();
  const { confirm, prompt } = usePopup();
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/api/ticket-sets")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setError("Failed to load ticket sets."));
  }, []);

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Delete ticket set",
      message: "Are you sure you want to delete this ticket set? This cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`http://localhost:3000/api/ticket-sets/${id}`, {
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
      title: "Rename ticket set",
      message: "Enter a new name for this ticket set.",
      confirmText: "Save",
      defaultValue: entry.name,
      placeholder: "Ticket set name",
    });

    if (nextName === null) return;
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === entry.name) return;

    try {
      const res = await fetch(`http://localhost:3000/api/ticket-sets/${entry.id}`, {
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

      <div className="ts-toolbar">
        <div className="ts-toolbar-left">
          <input
            className="ts-search"
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="ts-error">{error}</p>}

      {!filteredEntries.length ? (
        <p className="ts-table-status">
          {entries.length ? "No matches found." : "No ticket sets available yet."}
        </p>
      ) : (
        <div className="ts-table-wrapper">
          <table className="ts-table ts-list-table">
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
                    className="ts-name-link"
                    onClick={() => navigate(`/ticket-sets/${entry.id}`, { state: entry })}
                  >
                    {entry.name}
                  </td>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                  <td>
                    <div className="ts-actions">
                      <button
                        className="ts-icon-btn"
                        title="View"
                        onClick={() => navigate(`/ticket-sets/${entry.id}`, { state: entry })}
                      >
                        <BsEye />
                      </button>
                      <button
                        className="ts-icon-btn"
                        title="Edit name"
                        onClick={() => handleRename(entry)}
                      >
                        <BsPencil />
                      </button>
                      <button
                        className="ts-icon-btn ts-icon-danger"
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
