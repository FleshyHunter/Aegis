import { TicketSetTableView } from "./TicketSetEntry";

export default function TicketSetPipeline() {
  return (
    <TicketSetTableView
      emptyMessage="No pipeline data found for this ticket set."
    />
  );
}
