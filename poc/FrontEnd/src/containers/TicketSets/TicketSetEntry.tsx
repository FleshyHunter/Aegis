import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import { fetchRawTestCasesForTicketSet, fetchTicketSetById } from "../../api/api";
import "./TicketSets.css";

interface TicketSetDetail {
  id: string;
  name: string;
  source_filename: string;
  source_type: string;
  row_count: number;
  raw_test_case_id?: string;
  derived_test_case_id?: string;
  created_at: string;
}

export interface TableData {
  id: string;
  name: string;
  columns: string[];
  rows: TableRow[];
  row_count: number;
}

interface TableRow {
  [key: string]: unknown;
}

interface TicketSetTableViewProps {
  emptyMessage: string;
  fetchTable?: (id: string) => Promise<TableData>;
}

const VIEW_TABS = [
  { key: "raw", label: "Raw", path: "raw" },
  { key: "derived", label: "Derived", path: "derived" },
  { key: "pipeline", label: "Pipeline", path: "pipeline" },
  { key: "results", label: "Results", path: "results" },
];

export function TicketSetTableView({ emptyMessage, fetchTable }: TicketSetTableViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [entry, setEntry] = useState<TicketSetDetail | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setError(null);
    setTableData(null);

    fetchTicketSetById(id)
      .then((data) => {
        setEntry(data);
      })
      .catch((err) => setError(err.message));

    if (!fetchTable) return;

    fetchTable(id)
      .then(setTableData)
      .catch((err) => {
        setTableData(null);
        setError(err instanceof Error ? err.message : "Failed to load ticket set data.");
      });
  }, [fetchTable, id]);

  const tableRows = tableData?.rows ?? [];
  const tableColumns = getDisplayColumns(tableData?.columns ?? [], tableRows);

  return (
    <div>
      <Navbar />

      <div className="ts-entry-header">
        <button className="btn" onClick={() => navigate("/ticket-sets")}>← Back</button>
        {entry && (
          <>
            <span className="ts-entry-name">{entry.name}</span>
            <span className="ts-entry-info">
              {entry.row_count} rows · {new Date(entry.created_at).toLocaleString()}
            </span>
          </>
        )}
      </div>

      {entry && (
        <div className="ts-view-tabs">
          {VIEW_TABS.map((tab) => {
            const target = `/ticket-sets/${entry.id}/${tab.path}`;
            const isActive = location.pathname === target || (
              tab.key === "raw" && location.pathname === `/ticket-sets/${entry.id}`
            );
            return (
              <button
                key={tab.key}
                className={`ts-view-tab ${isActive ? "active" : ""}`}
                onClick={() => navigate(target)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="ts-error">{error}</p>}

      {entry && (
        <>
          <div className="ts-detail-panel">
            <dl className="ts-detail-grid">
              <div>
                <dt>Name</dt>
                <dd>{entry.name}</dd>
              </div>
              <div>
                <dt>Source filename</dt>
                <dd>{entry.source_filename || "—"}</dd>
              </div>
              <div>
                <dt>Source type</dt>
                <dd>{entry.source_type}</dd>
              </div>
              <div>
                <dt>Row count</dt>
                <dd>{entry.row_count}</dd>
              </div>
              {/* <div>
                <dt>Raw table</dt>
                <dd>{entry.raw_test_case_id || "—"}</dd>
              </div>
              <div>
                <dt>Derived table</dt>
                <dd>{entry.derived_test_case_id || "—"}</dd>
              </div> */}
            </dl>
          </div>

          {!tableRows.length ? (
            <p className="ts-table-status">{emptyMessage}</p>
          ) : (
            <div className="ts-table-wrapper">
              <table className="ts-table">
                <thead>
                  <tr>
                    {tableColumns.map((column) => (
                      <th key={column}>{formatColumnLabel(column)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, index) => (
                    <tr key={`${String(row.result_code || row.test_case_id || "row")}-${index}`}>
                      {tableColumns.map((column) => (
                        <td key={column}>{formatCellValue(row[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TicketSetEntry() {
  return (
    <TicketSetTableView
      fetchTable={fetchRawTestCasesForTicketSet}
      emptyMessage="No raw test cases found for this ticket set."
    />
  );
}

function getDisplayColumns(columns: string[], rows: TableRow[]): string[] {
  if (columns.length) return columns;

  const seen = new Set<string>();
  const fallbackColumns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (seen.has(key)) continue;
      seen.add(key);
      fallbackColumns.push(key);
    }
  }

  return fallbackColumns;
}

function formatColumnLabel(column: string): string {
  return column
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value
      .map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)))
      .join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
