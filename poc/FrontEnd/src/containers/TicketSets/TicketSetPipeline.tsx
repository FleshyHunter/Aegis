import { fetchPipelineRunsForTicketSet } from "../../api/api";
import { TicketSetTableView } from "./TicketSetEntry";

export default function TicketSetPipeline() {
  return (
    <TicketSetTableView
      fetchTable={fetchPipelineRunsForTicketSet}
      emptyMessage="No pipeline data found for this ticket set."
    />
  );
}
