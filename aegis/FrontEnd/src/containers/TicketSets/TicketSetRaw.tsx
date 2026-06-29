import { fetchRawTestCasesForTicketSet } from "../../api/api";
import { TicketSetTableView } from "./TicketSetEntry";

export default function TicketSetRaw() {
  return (
    <TicketSetTableView
      fetchTable={fetchRawTestCasesForTicketSet}
      emptyMessage="No raw test cases found for this ticket set."
    />
  );
}
