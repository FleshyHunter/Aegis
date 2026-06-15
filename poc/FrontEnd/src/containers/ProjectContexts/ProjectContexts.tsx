import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsEye, BsPencil, BsTrash } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import Button from "../../components/Button/Button";
import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
import { createProjectContext, fetchProjectContexts } from "../../api/api";
import "./ProjectContexts.css";

export interface ProjectContextSummary {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  context_text: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectContexts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<ProjectContextSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjectContexts()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load project contexts."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(input: ProjectContextFormValues) {
    setError(null);
    const created = await createProjectContext(input);
    setEntries((prev) => {
      const nextEntries = input.is_default
        ? prev.map((entry) => ({ ...entry, is_default: false }))
        : prev;

      return [created, ...nextEntries];
    });
    setShowCreateModal(false);
  }

  const filteredEntries = useMemo(
    () => entries.filter((entry) => entry.name.toLowerCase().includes(search.toLowerCase())),
    [entries, search]
  );

  const pagination = usePagination(filteredEntries, 20);

  return (
    <div>
      <Navbar />

      <div className="pc-toolbar">
        <div className="pc-toolbar-left">
          <input
            className="pc-search"
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pc-toolbar-right">
          <Button label="Add Project Context" onClick={() => setShowCreateModal(true)} />
        </div>
      </div>

      {error && <p className="pc-error">{error}</p>}

      {loading ? (
        <p className="pc-table-status">Loading project contexts...</p>
      ) : !filteredEntries.length ? (
        <p className="pc-table-status">
          {entries.length ? "No matches found." : "No project contexts created yet."}
        </p>
      ) : (
        <div className="pc-table-wrapper">
          <table className="pc-table pc-list-table">
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
                    className="pc-name-link"
                    onClick={() => navigate(`/project-contexts/${entry.id}`, { state: entry })}
                  >
                    {entry.name}
                  </td>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                  <td>
                    <div className="pc-actions">
                      <button
                        className="pc-icon-btn"
                        title="View"
                        onClick={() => navigate(`/project-contexts/${entry.id}`, { state: entry })}
                      >
                        <BsEye />
                      </button>
                      <button className="pc-icon-btn" title="Edit name" disabled>
                        <BsPencil />
                      </button>
                      <button className="pc-icon-btn pc-icon-danger" title="Delete" disabled>
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

      {showCreateModal && (
        <ProjectContextFormModal
          onCancel={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

interface ProjectContextFormValues {
  name: string;
  description: string;
  context_text: string;
  is_default: boolean;
}

interface ProjectContextFormModalProps {
  onCancel: () => void;
  onSubmit: (input: ProjectContextFormValues) => Promise<void>;
}

function ProjectContextFormModal({ onCancel, onSubmit }: ProjectContextFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contextText, setContextText] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }

    if (!contextText.trim()) {
      setFormError("Context text is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        context_text: contextText.trim(),
        is_default: isDefault,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create project context.");
      setSaving(false);
    }
  }

  return (
    <div className="popup-overlay" onClick={onCancel}>
      <div className="popup-box pc-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="popup-title">Add Project Context</div>

        <form className="pc-form" onSubmit={handleSubmit}>
          <label className="pc-form-field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="pc-form-field">
            <span>Description</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="pc-form-field">
            <span>Context Text</span>
            <textarea
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
            />
          </label>

          <label className="pc-default-toggle">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span>Set as default</span>
          </label>

          {formError && <p className="pc-form-error">{formError}</p>}

          <div className="popup-actions">
            <button className="btn" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
