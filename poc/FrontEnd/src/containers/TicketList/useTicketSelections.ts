import { useState } from "react";
import type {
  BuildingBlockSelection,
} from "../../components/BuildingBlockSelectModal/BuildingBlockSelectModal";
import type {
  ProjectContextSelection,
} from "../../components/ProjectContextSelectModal/ProjectContextSelectModal";
import type { ModalTarget, TicketRow } from "./TicketList.types";

export function useTicketSelections() {
  const [baName, setBaName] = useState<string | null>(null);
  const [baId, setBaId] = useState<string>("");
  const [baData, setBaData] = useState<TicketRow[]>([]);
  const [baIsNew, setBaIsNew] = useState(false);
  const [selectedBuildingBlocks, setSelectedBuildingBlocks] = useState<BuildingBlockSelection[]>([]);
  const [selectedProjectContext, setSelectedProjectContext] = useState<ProjectContextSelection | null>(null);
  const [activeModal, setActiveModal] = useState<ModalTarget>(null);

  function handleBaSelect(name: string, selectedRows: TicketRow[], isNew: boolean, id?: string) {
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

  return {
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
    activeModal,
    setActiveModal,
    handleBaSelect,
    handleClearBaSelect,
  };
}
