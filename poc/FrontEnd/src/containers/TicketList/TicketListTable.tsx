import { usePagination } from "../../components/Pagination/usePagination";
import Pagination from "../../components/Pagination/Pagination";
import type { TicketRow } from "./TicketList.types";

interface Column {
  key: string;
  label: string;
}

const COLUMNS: Column[] = [
  { key: "jira_ticket_id", label: "Jira Ticket ID" },
  { key: "test_case_id", label: "Test Case ID" },
  { key: "source_result_code", label: "Result Code" },
  { key: "classification", label: "Classification" },
  { key: "building_block", label: "Building Block" },
  { key: "explanation", label: "Explanation" },
  { key: "label_hint", label: "Label Hint" },
];

interface TicketListTableProps {
  rows: TicketRow[];
}

export default function TicketListTable({ rows }: TicketListTableProps) {
  const pagination = usePagination(rows, 20);

  if (!rows.length) {
    return <p className="table-status">Import a Jira test step CSV to view data.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="ticket-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagination.pageItems.map((row, i) => (
            <tr key={pagination.startIndex + i}>
              {COLUMNS.map((col) => (
                <td key={col.key}>{row[col.key] || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        perPage={pagination.perPage}
        totalItems={pagination.totalItems}
        onPrev={() => pagination.setPage((p) => p - 1)}
        onNext={() => pagination.setPage((p) => p + 1)}
      />
    </div>
  );
}
