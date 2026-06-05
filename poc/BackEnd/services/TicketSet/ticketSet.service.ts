import { TicketSet } from "../../models/TicketSet";

export async function getAllTicketSets() {
  return TicketSet.find().sort({ created_at: -1 }).lean();
}

export async function getTicketSetById(id: string) {
  return TicketSet.findById(id).lean();
}

export async function createTicketSet(name: string, rows: Record<string, string>[]) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return TicketSet.create({ name, columns, rows, row_count: rows.length });
}

export async function updateTicketSetName(id: string, name: string) {
  return TicketSet.findByIdAndUpdate(id, { name }, { new: true }).lean();
}

export async function deleteTicketSet(id: string) {
  return TicketSet.findByIdAndDelete(id).lean();
}
