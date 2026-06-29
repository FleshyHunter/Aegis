import { useMemo, useState } from "react";
import "./TicketList.css";
import Navbar from "../../components/Layout/Navbar";
import CsvSelectModal from "../../components/CsvSelectModal/CsvSelectModal";
import BuildingBlockSelectModal from "../../components/BuildingBlockSelectModal/BuildingBlockSelectModal";
import ProjectContextSelectModal from "../../components/ProjectContextSelectModal/ProjectContextSelectModal";
import TicketUploadModal from "../../components/TicketUploadModal/TicketUploadModal";
import { fetchBAListById, fetchBALists } from "../../api/api";
import TicketListTable from "./TicketListTable";
import TicketListToolbar from "./TicketListToolbar";
import TicketRunContextPanel from "./TicketRunContextPanel";
import { useTicketImport } from "./useTicketImport";
import { useTicketPipelineRun } from "./useTicketPipelineRun";
import { useTicketSelections } from "./useTicketSelections";
import type { TicketRow } from "./TicketList.types";

export default function TicketList() {
  const [userPrompt, setUserPrompt] = useState("");
  const ticketImport = useTicketImport();
  const selections = useTicketSelections();
  const pipelineRun = useTicketPipelineRun({
    jiraFileName: ticketImport.jiraFileName,
    rawRows: ticketImport.rawRows,
    baName: selections.baName,
    baId: selections.baId,
    setBaId: selections.setBaId,
    baData: selections.baData,
    baIsNew: selections.baIsNew,
    setBaIsNew: selections.setBaIsNew,
    selectedBuildingBlocks: selections.selectedBuildingBlocks,
    setSelectedBuildingBlocks: selections.setSelectedBuildingBlocks,
    selectedProjectContext: selections.selectedProjectContext,
    setSelectedProjectContext: selections.setSelectedProjectContext,
    userPrompt,
  });
  const displayRows = useMemo(
    () => filterRows(mergeSummaryRows(ticketImport.rows, pipelineRun.summaryRows), ticketImport.filter),
    [pipelineRun.summaryRows, ticketImport.filter, ticketImport.rows]
  );

  return (
    <div>
      <Navbar />

      <TicketListToolbar
        filter={ticketImport.filter}
        onFilterChange={ticketImport.setFilter}
        onOpenModal={selections.setActiveModal}
        running={pipelineRun.running}
        canRun={ticketImport.rows.length > 0}
        onRun={pipelineRun.handleRun}
        runError={pipelineRun.runError}
      />

      <TicketRunContextPanel
        value={userPrompt}
        onChange={setUserPrompt}
        showCompleted={pipelineRun.runMessage !== null}
      />

      {selections.activeModal === "ba" && (
        <CsvSelectModal
          title="Select BA Rules"
          fetchEntries={fetchBALists}
          fetchEntryById={fetchBAListById}
          selectedName={selections.baName}
          onSelect={selections.handleBaSelect}
          onClearSelected={selections.handleClearBaSelect}
          onClose={() => selections.setActiveModal(null)}
        />
      )}

      {selections.activeModal === "bb" && (
        <BuildingBlockSelectModal
          selected={selections.selectedBuildingBlocks}
          onChange={selections.setSelectedBuildingBlocks}
          onClose={() => selections.setActiveModal(null)}
        />
      )}

      {selections.activeModal === "context" && (
        <ProjectContextSelectModal
          selected={selections.selectedProjectContext}
          onChange={selections.setSelectedProjectContext}
          onClose={() => selections.setActiveModal(null)}
        />
      )}

      {selections.activeModal === "tickets" && (
        <TicketUploadModal
          selectedName={ticketImport.jiraFileName}
          onUpload={ticketImport.handleJiraUpload}
          onClearSelected={ticketImport.handleClearJiraUpload}
          onClose={() => selections.setActiveModal(null)}
        />
      )}

      <TicketListTable rows={displayRows} />
    </div>
  );
}

function mergeSummaryRows(
  rows: TicketRow[],
  summaryRows: TicketRow[]
): TicketRow[] {
  if (!summaryRows.length) return rows;

  const summaryByKey = new Map(
    summaryRows.map((summary) => [buildTicketKey(summary), summary])
  );

  return rows.map((row) => {
    const summary = summaryByKey.get(buildTicketKey(row));
    if (!summary) return row;

    return {
      ...row,
      source_result_code: summary.source_result_code,
      classification: summary.classification,
      building_block: summary.building_block,
      explanation: summary.explanation,
      label_hint: summary.label_hint || row.label_hint,
    };
  });
}

function filterRows(rows: TicketRow[], filter: string): TicketRow[] {
  if (filter === "All") return rows;

  return rows.filter((row) => getFilterValue(row.classification) === filter);
}

function buildTicketKey(row: TicketRow): string {
  return `${(row.jira_ticket_id || "").toLowerCase()}::${(row.test_case_id || "").toLowerCase()}`;
}

function getFilterValue(classification = ""): string {
  const normalized = classification.trim().toLowerCase();
  if (normalized === "pass") return "PASSED";
  if (normalized === "failed") return "FAILED";
  if (normalized === "skipped") return "SKIPPED";
  return "";
}
