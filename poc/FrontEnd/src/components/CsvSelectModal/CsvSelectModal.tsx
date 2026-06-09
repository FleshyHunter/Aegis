import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { BsTrash, BsCheckCircleFill, BsFileEarmarkText } from "react-icons/bs";
import "./CsvSelectModal.css";

interface Row {
  [key: string]: string;
}

interface EntrySummary {
  id: string;
  name: string;
  created_at: string;
}

interface Props {
  title: string;
  fetchUrl: string;
  detailUrl: string;
  selectedName?: string | null;
  onSelect: (name: string, rows: Row[], isNew: boolean) => void;
  onClearSelected?: () => void;
  onClose: () => void;
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

export default function CsvSelectModal({
  title,
  fetchUrl,
  detailUrl,
  selectedName,
  onSelect,
  onClearSelected,
  onClose,
}: Props) {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(fetchUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(setEntries)
      .catch(() => setError("Failed to load existing entries."))
      .finally(() => setLoadingList(false));
  }, [fetchUrl]);

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    onSelect(file.name, rows, true);
  }

  async function handleSelectExisting(entry: EntrySummary) {
    setLoadingEntry(entry.id);
    setError(null);
    try {
      const res = await fetch(`${detailUrl}/${entry.id}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      onSelect(entry.name, data.rows, false);
    } catch {
      setError("Failed to load entry. Please try again.");
      setLoadingEntry(null);
    }
  }

  return (
    <div className="csm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="csm-box">
        <div className="csm-header">
          <span className="csm-title">{title}</span>
          <button className="csm-close" onClick={onClose}>✕</button>
        </div>

        <div className="csm-section">
          <p className="csm-section-label">Upload new file</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Choose CSV file
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
          ) : entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
            <p className="csm-status">{entries.length ? "No matches found." : "No entries found."}</p>
          ) : (
            entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())).map((entry) => (
              <button
                key={entry.id}
                className="csm-entry"
                disabled={loadingEntry === entry.id}
                onClick={() => handleSelectExisting(entry)}
              >
                <span className="csm-entry-name">{entry.name}</span>
                <span className="csm-entry-date">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>

        {selectedName && (
          <div className="csm-selected">
            <BsCheckCircleFill className="csm-selected-check" />
            <BsFileEarmarkText className="csm-selected-file-icon" />
            <span className="csm-selected-name">{selectedName}</span>
            <button
              className="csm-selected-delete"
              title="Remove selected file"
              onClick={onClearSelected}
            >
              <BsTrash />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
