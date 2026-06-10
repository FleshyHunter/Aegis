import { Types } from "mongoose";
import {
  RawTestCase,
  type IRawTestCase,
  type SourceTestCaseRow,
} from "../../models/RawTestCase/RawTestCase";

interface CreateRawTestCaseTableInput {
  ticketSetId: Types.ObjectId;
  name: string;
  sourceFilename: string;
  rows: SourceTestCaseRow[];
}

export type { SourceTestCaseRow };

export async function createRawTestCaseTable(
  input: CreateRawTestCaseTableInput
): Promise<IRawTestCase> {
  const columns = getColumns(input.rows);

  return RawTestCase.create({
    ticket_set_id: input.ticketSetId,
    name: input.name,
    source_filename: input.sourceFilename,
    columns,
    rows: input.rows,
    row_count: input.rows.length,
  });
}

export async function getRawTestCaseTableByTicketSetId(ticketSetId: string) {
  return RawTestCase.findOne({ ticket_set_id: ticketSetId }).lean();
}

function getColumns(rows: SourceTestCaseRow[]): string[] {
  const seen = new Set<string>();
  const columns: string[] = [];

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (seen.has(key)) continue;
      seen.add(key);
      columns.push(key);
    }
  }

  return columns;
}
