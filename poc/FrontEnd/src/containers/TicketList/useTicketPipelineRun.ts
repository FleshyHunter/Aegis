import { useState } from "react";
import {
  createProjectContext,
  importBAList,
  importTicketSet,
  runPipeline,
  uploadBuildingBlock,
} from "../../api/api";
import type {
  BuildingBlockSelection,
} from "../../components/BuildingBlockSelectModal/BuildingBlockSelectModal";
import type {
  ProjectContextSelection,
} from "../../components/ProjectContextSelectModal/ProjectContextSelectModal";
import type { TicketRow } from "./TicketList.types";

interface UseTicketPipelineRunInput {
  jiraFileName: string | null;
  rawRows: TicketRow[];
  baName: string | null;
  baId: string;
  setBaId: (id: string) => void;
  baData: TicketRow[];
  baIsNew: boolean;
  setBaIsNew: (isNew: boolean) => void;
  selectedBuildingBlocks: BuildingBlockSelection[];
  setSelectedBuildingBlocks: (selected: BuildingBlockSelection[]) => void;
  selectedProjectContext: ProjectContextSelection | null;
  setSelectedProjectContext: (selected: ProjectContextSelection | null) => void;
  userPrompt: string;
}

export function useTicketPipelineRun({
  jiraFileName,
  rawRows,
  baName,
  baId,
  setBaId,
  baData,
  baIsNew,
  setBaIsNew,
  selectedBuildingBlocks,
  setSelectedBuildingBlocks,
  selectedProjectContext,
  setSelectedProjectContext,
  userPrompt,
}: UseTicketPipelineRunInput) {
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

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

      let effectiveProjectContext = selectedProjectContext;
      if (selectedProjectContext?.isNew) {
        const createdContext = await createProjectContext({
          name: selectedProjectContext.name,
          description: selectedProjectContext.description,
          context_text: selectedProjectContext.context_text,
        });
        effectiveProjectContext = createdContext;
        setSelectedProjectContext(createdContext);
      }

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
        projectContext: effectiveProjectContext
          ? {
              id: effectiveProjectContext.id,
              name: effectiveProjectContext.name,
              contextText: effectiveProjectContext.context_text,
            }
          : undefined,
      });

      setRunMessage("Pipeline started. Derived test cases are available in Ticket Sets.");
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  }

  return {
    running,
    runError,
    runMessage,
    handleRun,
  };
}
