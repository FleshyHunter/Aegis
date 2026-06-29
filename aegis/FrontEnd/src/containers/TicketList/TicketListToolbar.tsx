import { BsPlayFill } from "react-icons/bs";
import Button from "../../components/Button/Button";
import Toolbar from "../../components/ToolBar/Toolbar";
import type { ModalTarget } from "./TicketList.types";

const FILTERS = ["All", "PASSED", "FAILED", "SKIPPED"];

interface TicketListToolbarProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  onOpenModal: (target: ModalTarget) => void;
  running: boolean;
  canRun: boolean;
  onRun: () => void;
  runError: string | null;
}

export default function TicketListToolbar({
  filter,
  onFilterChange,
  onOpenModal,
  running,
  canRun,
  onRun,
  runError,
}: TicketListToolbarProps) {
  return (
    <Toolbar
      left={
        <>
          {FILTERS.map((f) => (
            <Button
              key={f}
              label={f}
              variant={filter === f ? "primary" : "default"}
              onClick={() => onFilterChange(f)}
            />
          ))}
        </>
      }
      right={
        <>
          <Button label="Project Context" onClick={() => onOpenModal("context")} />
          <Button label="BA Rules" onClick={() => onOpenModal("ba")} />
          <Button label="Building Blocks" onClick={() => onOpenModal("bb")} />
          <Button label="Import Tickets" onClick={() => onOpenModal("tickets")} />
          <Button
            label={running ? "Running..." : "Run"}
            icon={<BsPlayFill />}
            variant="primary"
            disabled={!canRun || running}
            onClick={onRun}
          />
          {runError && <span className="table-error">{runError}</span>}
        </>
      }
    />
  );
}
