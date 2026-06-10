import { useState } from "react";
import { BsPlayFill } from "react-icons/bs";
import "./TicketList.css";
import Navbar from "../../components/Layout/Navbar";
import Button from "../../components/Button/Button";
import Toolbar from "../../components/ToolBar/Toolbar";
import CsvSelectModal from "../../components/CsvSelectModal/CsvSelectModal";
import BuildingBlockSelectModal, {
  type BuildingBlockSelection,
} from "../../components/BuildingBlockSelectModal/BuildingBlockSelectModal";
import TicketUploadModal from "../../components/TicketUploadModal/TicketUploadModal";
import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
import { importBAList, importTicketSet, runPipeline, uploadBuildingBlock } from "../../api/api";
import { parseCSV } from "../../utils/csv";

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
  { key: "source_result_code",  label: "Result Code" },
  { key: "classification",      label: "Classification" },
  { key: "building_block",      label: "Building Block" },
  { key: "explanation",         label: "Explanation" },
  { key: "label_hint",          label: "Label Hint" },
];

const FILTERS = ["All", "PASSED", "FAILED", "SKIPPED"];

const TICKET_FIELD_ALIASES = {
  jira_ticket_id: ["jira_ticket_id", "ticket_id", "jira_key", "issue_key", "key"],
  test_case_id: ["test_case_id", "testcase_id", "test_id", "case_id"],
  source_result_code: ["source_result_code", "result_code", "code"],
};

function readFile(file: File): Promise<Row[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(parseCSV(e.target?.result as string));
    reader.readAsText(file);
  });
}

type ModalTarget = "ba" | "bb" | "tickets" | null;

export default function TicketList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [rawRows, setRawRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [jiraFileName, setJiraFileName] = useState<string | null>(null);

  const [baName, setBaName] = useState<string | null>(null);
  const [baId, setBaId] = useState<string>("");
  const [baData, setBaData] = useState<Row[]>([]);
  const [baIsNew, setBaIsNew] = useState(false);
  const [selectedBuildingBlocks, setSelectedBuildingBlocks] = useState<BuildingBlockSelection[]>([]);
  const [userPrompt, setUserPrompt] = useState("");

  const [activeModal, setActiveModal] = useState<ModalTarget>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  async function handleJiraUpload(file: File) {
    setJiraFileName(file.name);
    const parsed = await readFile(file);
    setRawRows(parsed);
    setRows(parsed.map(normalizeTicketRow));
  }

  function handleClearJiraUpload() {
    setJiraFileName(null);
    setRawRows([]);
    setRows([]);
    setFilter("All");
  }

  function handleBaSelect(name: string, selectedRows: Row[], isNew: boolean, id?: string) {
    setBaName(name);
    setBaId(id ?? "");
    setBaData(selectedRows);
    setBaIsNew(isNew);
  }

  function handleClearBaSelect() {
    setBaName(null);
    setBaId("");
    setBaData([]);
    setBaIsNew(false);
  }

  async function handleRun() {
    if (!jiraFileName || !rawRows.length) return;

    setRunning(true);
    setRunError(null);
    setRunMessage(null);

    try {
      let baListId = baId;
      if (baIsNew && baName && baData.length) {
        const createdBa = await importBAList(baName, baData);
        baListId = createdBa.id;
        setBaId(createdBa.id);
        setBaIsNew(false);
      }

      const uploadedBuildingBlocks = await Promise.all(
        selectedBuildingBlocks.map(async (entry) => {
          if (!entry.isNew || !entry.file) return entry;
          const created = await uploadBuildingBlock(entry.file);
          return {
            id: created.id,
            name: created.name,
            created_at: created.created_at,
          };
        })
      );
      setSelectedBuildingBlocks(uploadedBuildingBlocks);

      const ticketSet = await importTicketSet(
        `${jiraFileName} import`,
        jiraFileName,
        rawRows
      );

      await runPipeline({
        ticketSetId: ticketSet.id,
        baListId,
        buildingBlockIds: uploadedBuildingBlocks.map((entry) => entry.id),
        userPrompt,
      });

      setRunMessage("Pipeline started. Derived test cases are available in Ticket Sets.");
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Run failed.");
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
            <Button label="BA Rules" onClick={() => setActiveModal("ba")} />
            <Button label="Building Blocks" onClick={() => setActiveModal("bb")} />

            <Button label="Import Tickets" onClick={() => setActiveModal("tickets")} />

            <Button
              label={running ? "Running..." : "Run"}
              icon={<BsPlayFill />}
              variant="primary"
              disabled={!rows.length || running}
              onClick={handleRun}
            />
            {runError && <span className="table-error">{runError}</span>}
            {runMessage && <span className="table-status">{runMessage}</span>}
          </>
        }
      />

      <section className="run-context-panel">
        <label className="run-context-label" htmlFor="ticket-run-context">
          Additional Evaluation Context
        </label>
        <textarea
          id="ticket-run-context"
          className="run-context-textarea"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Optional context for this run. This supports the evaluator but does not override the core validation rules."
        />
      </section>

      {activeModal === "ba" && (
        <CsvSelectModal
          title="Select BA Rules"
          fetchUrl="http://localhost:3000/api/ba-lists"
          detailUrl="http://localhost:3000/api/ba-lists"
          selectedName={baName}
          onSelect={handleBaSelect}
          onClearSelected={handleClearBaSelect}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "bb" && (
        <BuildingBlockSelectModal
          selected={selectedBuildingBlocks}
          onChange={setSelectedBuildingBlocks}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "tickets" && (
        <TicketUploadModal
          selectedName={jiraFileName}
          onUpload={handleJiraUpload}
          onClearSelected={handleClearJiraUpload}
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

function normalizeTicketRow(row: Row): Row {
  return {
    ...row,
    jira_ticket_id: getFirstValue(row, TICKET_FIELD_ALIASES.jira_ticket_id),
    test_case_id: getFirstValue(row, TICKET_FIELD_ALIASES.test_case_id),
  };
}

function getFirstValue(row: Row, keys: string[]): string {
  const normalizedRow = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value])
  );

  for (const key of keys) {
    const value = normalizedRow[normalizeKey(key)]?.trim();
    if (value) return value;
  }

  return "";
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}
