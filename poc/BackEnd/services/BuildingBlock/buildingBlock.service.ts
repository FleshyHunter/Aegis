import { BuildingBlock } from "../../models/BuildingBlock/BuildingBlock";
import { extractDocxText } from "./docxPreview.service";

interface CreateBuildingBlockInput {
  name: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export async function getAllBuildingBlocks() {
  return BuildingBlock.find()
    .select("-file_data -preview_text")
    .sort({ created_at: -1 })
    .lean();
}

export async function getBuildingBlockById(id: string) {
  const entry = await BuildingBlock.findById(id);
  if (!entry) return null;

  if (!entry.preview_status || (!entry.preview_text && !entry.preview_error)) {
    const preview = buildPreview(entry.file_data);
    entry.preview_text = preview.text;
    entry.preview_status = preview.status;
    entry.preview_error = preview.error;
    await entry.save();
  }

  return {
    _id: entry._id,
    name: entry.name,
    file_name: entry.file_name,
    source_type: entry.source_type,
    mime_type: entry.mime_type,
    size_bytes: entry.size_bytes,
    preview_text: entry.preview_text,
    preview_status: entry.preview_status,
    preview_error: entry.preview_error,
    created_at: entry.created_at,
  };
}

export async function createBuildingBlock(input: CreateBuildingBlockInput) {
  const preview = buildPreview(input.buffer);

  return BuildingBlock.create({
    name: input.name,
    file_name: input.fileName,
    source_type: "docx",
    mime_type: input.mimeType,
    size_bytes: input.buffer.length,
    file_data: input.buffer,
    preview_text: preview.text,
    preview_status: preview.status,
    preview_error: preview.error,
  });
}

export async function updateBuildingBlockName(id: string, name: string) {
  return BuildingBlock.findByIdAndUpdate(id, { name }, { new: true }).lean();
}

export async function deleteBuildingBlock(id: string) {
  return BuildingBlock.findByIdAndDelete(id).lean();
}

function buildPreview(
  buffer: Buffer
): { text: string; status: "ready" | "unsupported" | "failed"; error: string } {
  try {
    const text = extractDocxText(buffer);
    return {
      text,
      status: text ? "ready" : "failed",
      error: text ? "" : "No previewable text was found in this DOCX file.",
    };
  } catch (err) {
    return {
      text: "",
      status: "failed",
      error: err instanceof Error ? err.message : "Failed to extract DOCX preview.",
    };
  }
}
