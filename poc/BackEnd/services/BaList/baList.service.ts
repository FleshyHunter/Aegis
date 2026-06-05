import { BAList } from "../../models/BaList/BAList";

export async function getAllBALists() {
  return BAList.find().sort({ created_at: -1 }).lean();
}

export async function getBAListById(id: string) {
  return BAList.findById(id).lean();
}

export async function createBAList(name: string, rows: Record<string, string>[]) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return BAList.create({ name, columns, rows, row_count: rows.length });
}

export async function updateBAListName(id: string, name: string) {
  return BAList.findByIdAndUpdate(id, { name }, { new: true }).lean();
}

export async function deleteBAList(id: string) {
  return BAList.findByIdAndDelete(id).lean();
}
