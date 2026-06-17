import { useState } from "react";
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
        runMessage={pipelineRun.runMessage}
      />

      <TicketRunContextPanel
        value={userPrompt}
        onChange={setUserPrompt}
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

      <TicketListTable rows={ticketImport.filteredRows} />
    </div>
  );
}
