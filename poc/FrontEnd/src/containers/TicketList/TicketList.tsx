import React, { useState, useRef, ChangeEvent } from "react";
import "./TicketList.css";
import Navbar from "../../components/Layout/Navbar";
import Button from "../../components/Button/Button";
import Toolbar from "../../components/ToolBar/Toolbar";
import { runPipeline } from "../../api/api";

interface Column {
  key: string;
  label: string;
}

interface Row {
  [key: string]: string;
}

const COLUMNS: Column[] = [
  { key: "jira_ticket_id",      label: "Jira Ticket ID" },
  { key: "test_case_id",        label: "Test Case ID" },
  { key: "step_id",             label: "Step ID" },
  { key: "source_result_code",  label: "Result Code" },
  { key: "ba_action",           label: "BA Action" },
  { key: "ba_reason",           label: "BA Reason" },
  { key: "jira_action",         label: "Jira Action" },
  { key: "jira_expectation",    label: "Jira Expectation" },
  { key: "classification",      label: "Classification" },
  { key: "explanation",         label: "Explanation" },
  { key: "label_hint",          label: "Label Hint" },
];

const FILTERS = ["All", "MATCH", "MISMATCH"];

function parseCSV(text: string): Row[] {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",");
      return headers.reduce((row: Row, h, i) => {
        row[h] = values[i]?.trim() ?? "";
        return row;
      }, {});
    });
}

function readFile(file: File): Promise<Row[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(parseCSV(e.target?.result as string));
    reader.readAsText(file);
  });
}

export default function TicketList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [jiraFileName, setJiraFileName] = useState<string | null>(null);
  const [baFileName, setBaFileName] = useState<string | null>(null);
  const [baData, setBaData] = useState<Row[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);

  const jiraFileRef = useRef<HTMLInputElement>(null);
  const baFileRef = useRef<HTMLInputElement>(null);

  async function handleJiraUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setJiraFileName(file.name);
    const parsed = await readFile(file);
    setRows(parsed);
  }

  async function handleBaUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBaFileName(file.name);
    const parsed = await readFile(file);
    setBaData(parsed);
  }

  async function handleRun() {
    setRunning(true);
    setRunError(null);
    try {
      const data = await runPipeline(baData, rows);
      setRows(data.results);
      setFilter("All");
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Pipeline failed.");
    } finally {
      setRunning(false);
    }
  }

  const filteredRows =
    filter === "All"
      ? rows
      : rows.filter((row) => (row["classification"] || "").toUpperCase() === filter);

  return (
    <div>
      <Navbar />

      <Toolbar
        left={
          <>
            {FILTERS.map((f) => (
              <Button
                key={f}
                label={f}
                variant={filter === f ? "primary" : "default"}
                onClick={() => setFilter(f)}
              />
            ))}
          </>
        }
        right={
          <>
            <input ref={baFileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleBaUpload} />
            <Button label="Building Blocks" onClick={() => baFileRef.current?.click()} />
            {baFileName && <span className="file-name">{baFileName}</span>}

            <input ref={jiraFileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleJiraUpload} />
            <Button label="Import" onClick={() => jiraFileRef.current?.click()} />
            {jiraFileName && <span className="file-name">{jiraFileName}</span>}

            <Button
              label={running ? "Running..." : "Run"}
              variant="primary"
              disabled={!baData.length || !rows.length || running}
              onClick={handleRun}
            />
            {runError && <span className="table-error">{runError}</span>}
          </>
        }
      />

      {!rows.length ? (
        <p className="table-status">Import a Jira test step CSV to view data.</p>
      ) : (
        <div className="table-wrapper">
          <table className="ticket-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => (
                <tr key={i}>
                  {COLUMNS.map((col) => (
                    <td key={col.key}>{row[col.key] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
