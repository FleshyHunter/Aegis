import { useMemo, useState } from "react";
import { parseCSV } from "../../utils/csv";
import type { TicketRow } from "./TicketList.types";

const TICKET_FIELD_ALIASES = {
  jira_ticket_id: ["jira_ticket_id", "ticket_id", "jira_key", "issue_key", "key"],
  test_case_id: ["test_case_id", "testcase_id", "test_id", "case_id"],
};

export function useTicketImport() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [rawRows, setRawRows] = useState<TicketRow[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [jiraFileName, setJiraFileName] = useState<string | null>(null);

  async function handleJiraUpload(file: File) {
    setJiraFileName(file.name);
    const parsed = await readFile(file);
    setRawRows(parsed);
    setRows(parsed.map(normalizeTicketRow));
  }

  function handleClearJiraUpload() {
    setJiraFileName(null);
    setRawRows([]);
    setRows([]);
    setFilter("All");
  }

  const filteredRows = useMemo(
    () =>
      filter === "All"
        ? rows
        : rows.filter((row) => (row["classification"] || "").toUpperCase() === filter),
    [filter, rows]
  );

  return {
    rows,
    rawRows,
    filteredRows,
    filter,
    setFilter,
    jiraFileName,
    handleJiraUpload,
    handleClearJiraUpload,
  };
}

function readFile(file: File): Promise<TicketRow[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(parseCSV(e.target?.result as string));
    reader.readAsText(file);
  });
}

function normalizeTicketRow(row: TicketRow): TicketRow {
  return {
    ...row,
    jira_ticket_id: getFirstValue(row, TICKET_FIELD_ALIASES.jira_ticket_id),
    test_case_id: getFirstValue(row, TICKET_FIELD_ALIASES.test_case_id),
  };
}

function getFirstValue(row: TicketRow, keys: string[]): string {
  const normalizedRow = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value])
  );

  for (const key of keys) {
    const value = normalizedRow[normalizeKey(key)]?.trim();
    if (value) return value;
  }

  return "";
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}
