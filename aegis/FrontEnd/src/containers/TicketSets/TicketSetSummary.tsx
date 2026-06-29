import { fetchPipelineSummaryForTicketSet } from "../../api/api";
import { TicketSetTableView } from "./TicketSetEntry";

export default function TicketSetSummary() {
  return (
    <TicketSetTableView
      fetchTable={fetchPipelineSummaryForTicketSet}
      emptyMessage="No summary found for this ticket set."
    />
  );
}
