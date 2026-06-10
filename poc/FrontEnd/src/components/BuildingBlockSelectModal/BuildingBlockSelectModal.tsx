import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { BsTrash } from "react-icons/bs";
import { fetchBuildingBlocks } from "../../api/api";
import "../CsvSelectModal/CsvSelectModal.css";
import "./BuildingBlockSelectModal.css";

export interface BuildingBlockSelection {
  id: string;
  name: string;
  created_at: string;
  isNew?: boolean;
  file?: File;
}

interface Props {
  selected: BuildingBlockSelection[];
  onChange: (selected: BuildingBlockSelection[]) => void;
  onClose: () => void;
}

export default function BuildingBlockSelectModal({
  selected,
  onChange,
  onClose,
}: Props) {
  const [entries, setEntries] = useState<BuildingBlockSelection[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBuildingBlocks()
      .then(setEntries)
      .catch(() => setError("Failed to load existing building blocks."))
      .finally(() => setLoadingList(false));
  }, []);

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setError(null);

    const pendingSelections = files.map((file) => ({
      id: `pending:${file.name}:${file.lastModified}:${file.size}`,
      name: file.name,
      created_at: new Date().toISOString(),
      isNew: true,
      file,
    }));

    onChange(mergeUnique(selected, pendingSelections));
    e.target.value = "";
  }

  function toggleSelected(entry: BuildingBlockSelection) {
    if (selected.some((item) => item.id === entry.id)) {
      onChange(selected.filter((item) => item.id !== entry.id));
      return;
    }

    onChange([...selected, entry]);
  }

  function removeSelected(id: string) {
    onChange(selected.filter((entry) => entry.id !== id));
  }

  const filteredEntries = entries.filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="csm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="csm-box">
        <div className="csm-header">
          <span className="csm-title">Select Building Blocks</span>
          <button className="csm-close" onClick={onClose}>x</button>
        </div>

        <div className="csm-section">
          <p className="csm-section-label">Upload new files</p>
          <input
            ref={fileRef}
            type="file"
            accept=".docx"
            multiple
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Choose DOCX files
          </button>
        </div>

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
              const isSelected = selected.some((item) => item.id === entry.id);
              return (
                <button
                  key={entry.id}
                  className={`csm-entry ${isSelected ? "bbsm-entry-selected" : ""}`}
                  onClick={() => toggleSelected(entry)}
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

        {!!selected.length && (
          <>
            <div className="csm-divider">
              <span>selected</span>
            </div>

            <div className="bbsm-selected-list">
              {selected.map((entry) => (
                <div className="csm-selected" key={entry.id}>
                  <span className="csm-selected-name">{entry.name}</span>
                  {entry.isNew && <span className="bbsm-pending-label">Pending upload</span>}
                  <button
                    className="csm-selected-delete"
                    title="Remove selected building block"
                    onClick={() => removeSelected(entry.id)}
                  >
                    <BsTrash />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function mergeUnique(
  left: BuildingBlockSelection[],
  right: BuildingBlockSelection[]
): BuildingBlockSelection[] {
  const seen = new Set<string>();
  const merged: BuildingBlockSelection[] = [];

  for (const entry of [...left, ...right]) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
  }

  return merged;
}
