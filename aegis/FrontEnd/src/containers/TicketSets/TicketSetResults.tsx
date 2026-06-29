import { fetchPipelineResultsForTicketSet } from "../../api/api";
import { TicketSetTableView } from "./TicketSetEntry";

export default function TicketSetResults() {
  return (
    <TicketSetTableView
      fetchTable={fetchPipelineResultsForTicketSet}
      emptyMessage="No results found for this ticket set."
    />
  );
}
