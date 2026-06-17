import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { BsEye, BsPencil, BsTrash } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import {
  deleteBuildingBlock,
  fetchBuildingBlocks,
  renameBuildingBlock,
  uploadBuildingBlock,
} from "../../api/api";
import { usePopup } from "../../components/PopUp/PopupContext";
import type { EntrySummary } from "../../components/EntryView/EntrySummary.ts";
import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
import "./BuildingBlocks.css";

export default function BuildingBlocks() {
  const navigate = useNavigate();
  const { confirm, prompt } = usePopup();
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBuildingBlocks()
      .then(setEntries)
      .catch(() => setError("Failed to load building blocks."));
  }, []);

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const saved = await uploadBuildingBlock(file);
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
      await deleteBuildingBlock(id);
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
      const updated = await renameBuildingBlock(entry.id, trimmed);
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
            accept=".docx"
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
              {pagination.pageItems.map((entry) => (
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
