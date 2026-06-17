import { FormEvent, useEffect, useState } from "react";
import { BsTrash } from "react-icons/bs";
import { fetchProjectContexts } from "../../api/api";
import "../CsvSelectModal/CsvSelectModal.css";
import "./ProjectContextSelectModal.css";

export interface ProjectContextSelection {
  id: string;
  name: string;
  description: string;
  context_text: string;
  created_at: string;
  updated_at?: string;
  isNew?: boolean;
}

interface Props {
  selected: ProjectContextSelection | null;
  onChange: (selected: ProjectContextSelection | null) => void;
  onClose: () => void;
}

export default function ProjectContextSelectModal({
  selected,
  onChange,
  onClose,
}: Props) {
  const [entries, setEntries] = useState<ProjectContextSelection[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftText, setDraftText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectContexts()
      .then(setEntries)
      .catch(() => setError("Failed to load existing project contexts."))
      .finally(() => setLoadingList(false));
  }, []);

  function handleUseDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftName.trim()) {
      setFormError("Context name is required.");
      return;
    }

    if (!draftText.trim()) {
      setFormError("Context text is required.");
      return;
    }

    setFormError(null);
    onChange({
      id: `pending:${Date.now()}`,
      name: draftName.trim(),
      description: draftDescription.trim(),
      context_text: draftText.trim(),
      created_at: new Date().toISOString(),
      isNew: true,
    });
  }

  function removeSelected() {
    onChange(null);
  }

  const filteredEntries = entries.filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="csm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="csm-box pcsm-box">
        <div className="csm-header">
          <span className="csm-title">Select Project Context</span>
          <button className="csm-close" onClick={onClose}>x</button>
        </div>

        <form className="pcsm-form" onSubmit={handleUseDraft}>
          <p className="csm-section-label">Create new context</p>

          <input
            className="csm-search"
            type="text"
            placeholder="Context name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />

          <input
            className="csm-search"
            type="text"
            placeholder="Description"
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
          />

          <textarea
            className="pcsm-textarea"
            placeholder="Project vocabulary, domain context, release naming, known synonyms, or review guidance."
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
          />

          {formError && <p className="csm-error">{formError}</p>}

          <button className="btn" type="submit">
            Use Draft Context
          </button>
        </form>

        <div className="csm-divider">
          <span>or select existing</span>
        </div>

        <input
          className="csm-search"
          type="search"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="csm-list">
          {error && <p className="csm-error">{error}</p>}
          {loadingList ? (
            <p className="csm-status">Loading...</p>
          ) : !filteredEntries.length ? (
            <p className="csm-status">{entries.length ? "No matches found." : "No entries found."}</p>
          ) : (
            filteredEntries.map((entry) => {
              const isSelected = selected?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  className={`csm-entry ${isSelected ? "pcsm-entry-selected" : ""}`}
                  onClick={() => onChange(entry)}
                >
                  <span className="csm-entry-name">{entry.name}</span>
                  <span className="csm-entry-date">
                    {isSelected ? "Selected" : new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {selected && (
          <>
            <div className="csm-divider">
              <span>selected</span>
            </div>

            <div className="csm-selected">
              <span className="csm-selected-name">{selected.name}</span>
              {selected.isNew && <span className="pcsm-pending-label">Pending save on run</span>}
              <button
                className="csm-selected-delete"
                title="Remove selected project context"
                onClick={removeSelected}
              >
                <BsTrash />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
