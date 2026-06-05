import React, { useState, useRef, ChangeEvent } from "react";
import "./TicketList.css";
import Navbar from "../../components/Layout/Navbar";
import Button from "../../components/Button/Button";
import Toolbar from "../../components/ToolBar/Toolbar";
import CsvSelectModal from "../../components/CsvSelectModal/CsvSelectModal";
import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
import { runPipeline, importBAList, createBuildingBlock } from "../../api/api";

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

type ModalTarget = "ba" | "bb" | null;

export default function TicketList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [jiraFileName, setJiraFileName] = useState<string | null>(null);

  const [baName, setBaName] = useState<string | null>(null);
  const [baData, setBaData] = useState<Row[]>([]);
  const [baIsNew, setBaIsNew] = useState(false);

  const [bbName, setBbName] = useState<string | null>(null);
  const [bbData, setBbData] = useState<Row[]>([]);
  const [bbIsNew, setBbIsNew] = useState(false);

  const [activeModal, setActiveModal] = useState<ModalTarget>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);

  const jiraFileRef = useRef<HTMLInputElement>(null);

  async function handleJiraUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setJiraFileName(file.name);
    const parsed = await readFile(file);
    setRows(parsed);
  }

  function handleBaSelect(name: string, selectedRows: Row[], isNew: boolean) {
    setBaName(name);
    setBaData(selectedRows);
    setBaIsNew(isNew);
    setActiveModal(null);
  }

  function handleBbSelect(name: string, selectedRows: Row[], isNew: boolean) {
    setBbName(name);
    setBbData(selectedRows);
    setBbIsNew(isNew);
    setActiveModal(null);
  }

  async function handleRun() {
    if (!jiraFileName) return;
    setRunning(true);
    setRunError(null);
    try {
      if (baIsNew && baName && baData.length) {
        await importBAList(baName, baData);
        setBaIsNew(false);
      }
      if (bbIsNew && bbName && bbData.length) {
        await createBuildingBlock(bbName, bbData);
        setBbIsNew(false);
      }
      const ticketSetName = `${jiraFileName} (Checked)`;
      const data = await runPipeline(bbData, rows, ticketSetName);
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

  const pagination = usePagination(filteredRows, 20);

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
            <Button label="BA" onClick={() => setActiveModal("ba")} />
            {baName && <span className="file-name">{baName}</span>}

            <Button label="Building Blocks" onClick={() => setActiveModal("bb")} />
            {bbName && <span className="file-name">{bbName}</span>}

            <input
              ref={jiraFileRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleJiraUpload}
            />
            <Button label="Import" onClick={() => jiraFileRef.current?.click()} />
            {jiraFileName && <span className="file-name">{jiraFileName}</span>}

            <Button
              label={running ? "Running..." : "Run"}
              variant="primary"
              disabled={!bbData.length || !rows.length || running}
              onClick={handleRun}
            />
            {runError && <span className="table-error">{runError}</span>}
          </>
        }
      />

      {activeModal === "ba" && (
        <CsvSelectModal
          title="Select BA Rules"
          fetchUrl="http://localhost:3000/api/ba-lists"
          detailUrl="http://localhost:3000/api/ba-lists"
          onSelect={handleBaSelect}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "bb" && (
        <CsvSelectModal
          title="Select Building Blocks"
          fetchUrl="http://localhost:3000/api/building-blocks"
          detailUrl="http://localhost:3000/api/building-blocks"
          onSelect={handleBbSelect}
          onClose={() => setActiveModal(null)}
        />
      )}

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
              {pagination.pageItems.map((row, i) => (
                <tr key={pagination.startIndex + i}>
                  {COLUMNS.map((col) => (
                    <td key={col.key}>{row[col.key] || "—"}</td>
                  ))}
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
