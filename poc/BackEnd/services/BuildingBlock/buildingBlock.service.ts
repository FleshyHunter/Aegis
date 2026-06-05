import { BuildingBlock } from "../../models/BuildingBlock";

export async function getAllBuildingBlocks() {
  return BuildingBlock.find().sort({ created_at: -1 }).lean();
}

export async function getBuildingBlockById(id: string) {
  return BuildingBlock.findById(id).lean();
}

export async function createBuildingBlock(name: string, rows: Record<string, string>[]) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return BuildingBlock.create({ name, columns, rows, row_count: rows.length });
}

export async function updateBuildingBlockName(id: string, name: string) {
  return BuildingBlock.findByIdAndUpdate(id, { name }, { new: true }).lean();
}

export async function deleteBuildingBlock(id: string) {
  return BuildingBlock.findByIdAndDelete(id).lean();
}
