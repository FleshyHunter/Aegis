import { fetchDerivedTestCasesForTicketSet } from "../../api/api";
import { TicketSetTableView } from "./TicketSetEntry";

export default function TicketSetDerived() {
  return (
    <TicketSetTableView
      fetchTable={fetchDerivedTestCasesForTicketSet}
      emptyMessage="No derived test cases found for this ticket set."
    />
  );
}
