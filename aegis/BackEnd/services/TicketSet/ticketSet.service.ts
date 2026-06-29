import { DerivedTestCase } from "../../models/DerivedTestCase/DerivedTestCase";
import { RawTestCase } from "../../models/RawTestCase/RawTestCase";
import { TicketSet } from "../../models/TicketSet/TicketSet";
import { createDerivedTestCaseTableFromRaw } from "../DerivedTestCase/derivedTestCase.service";
import {
  createRawTestCaseTable,
  type SourceTestCaseRow,
} from "../RawTestCase/rawTestCase.service";

interface CreateTicketSetOptions {
  sourceFilename?: string;
  sourceType?: "csv" | "docx" | "jira_api" | "pipeline_result";
}

interface ImportTicketSetInput {
  name: string;
  sourceFilename: string;
  rows: SourceTestCaseRow[];
}

export async function getAllTicketSets() {
  return TicketSet.find().sort({ created_at: -1 }).lean();
}

export async function getTicketSetById(id: string) {
  return TicketSet.findById(id).lean();
}

export async function createTicketSet(
  name: string,
  rows: Record<string, string>[] = [],
  options: CreateTicketSetOptions = {}
) {
  return TicketSet.create({
    name,
    source_filename: options.sourceFilename ?? "",
    source_type: options.sourceType ?? "pipeline_result",
    row_count: rows.length,
  });
}

export async function importTicketSet(input: ImportTicketSetInput) {
  const ticketSet = await TicketSet.create({
    name: input.name,
    source_filename: input.sourceFilename,
    source_type: "csv",
    row_count: input.rows.length,
  });

  const rawTestCase = await createRawTestCaseTable({
    ticketSetId: ticketSet._id,
    name: input.name,
    sourceFilename: input.sourceFilename,
    rows: input.rows,
  });
  const derivedTestCase = await createDerivedTestCaseTableFromRaw(rawTestCase);
  ticketSet.raw_test_case_id = rawTestCase._id;
  ticketSet.derived_test_case_id = derivedTestCase._id;
  await ticketSet.save();

  return {
    ticketSet,
    rawTestCase,
    derivedTestCase,
  };
}

export async function updateTicketSetName(id: string, name: string) {
  return TicketSet.findByIdAndUpdate(id, { name }, { new: true }).lean();
}

export async function deleteTicketSet(id: string) {
  const ticketSet = await TicketSet.findById(id);

  if (!ticketSet) {
    return null;
  }

  const rawDeleteFilter = ticketSet.raw_test_case_id
    ? {
        $or: [
          { ticket_set_id: ticketSet._id },
          { _id: ticketSet.raw_test_case_id },
        ],
      }
    : { ticket_set_id: ticketSet._id };

  const derivedDeleteFilter = ticketSet.derived_test_case_id
    ? {
        $or: [
          { ticket_set_id: ticketSet._id },
          { _id: ticketSet.derived_test_case_id },
        ],
      }
    : { ticket_set_id: ticketSet._id };

  await Promise.all([
    RawTestCase.deleteMany(rawDeleteFilter),
    DerivedTestCase.deleteMany(derivedDeleteFilter),
  ]);

  await ticketSet.deleteOne();

  return ticketSet.toObject();
}
