import { TicketSet } from "../../models/TicketSet/TicketSet";

interface CreateTicketSetOptions {
  sourceFilename?: string;
  sourceType?: "csv" | "docx" | "jira_api" | "pipeline_result";
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

export async function updateTicketSetName(id: string, name: string) {
  return TicketSet.findByIdAndUpdate(id, { name }, { new: true }).lean();
}

export async function deleteTicketSet(id: string) {
  return TicketSet.findByIdAndDelete(id).lean();
}
