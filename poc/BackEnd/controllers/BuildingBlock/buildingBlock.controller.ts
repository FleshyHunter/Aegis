import { Request, Response } from "express";
import {
  getAllBuildingBlocks,
  getBuildingBlockById,
  createBuildingBlock,
  deleteBuildingBlock,
  updateBuildingBlockName,
} from "../../services/BuildingBlock/buildingBlock.service";

interface UploadedFile {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export async function getAllBuildingBlocksController(_req: Request, res: Response): Promise<void> {
  try {
    const list = await getAllBuildingBlocks();
    res.json(list.map((entry) => ({
      id: entry._id,
      name: entry.name,
      created_at: entry.created_at,
    })));
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to fetch building blocks." });
  }
}

export async function getBuildingBlockByIdController(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const entry = await getBuildingBlockById(req.params.id);
    if (!entry) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({
      id: entry._id,
      name: entry.name,
      file_name: entry.file_name,
      source_type: entry.source_type,
      mime_type: entry.mime_type,
      size_bytes: entry.size_bytes,
      preview_text: entry.preview_text,
      preview_status: entry.preview_status,
      preview_error: entry.preview_error,
      created_at: entry.created_at,
    });
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to fetch building block." });
  }
}

export async function updateBuildingBlockNameController(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required." });
    return;
  }
  try {
    const updated = await updateBuildingBlockName(req.params.id, name.trim());
    if (!updated) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({ id: updated._id, name: updated.name, created_at: updated.created_at });
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to update building block." });
  }
}

export async function deleteBuildingBlockController(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const deleted = await deleteBuildingBlock(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({ id: req.params.id });
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to delete building block." });
  }
}

export async function createBuildingBlockController(req: Request, res: Response): Promise<void> {
  try {
    const uploaded = await readMultipartFile(req, "file");

    if (!isDocxDocument(uploaded.fileName)) {
      res.status(400).json({ error: "Only .docx files are supported." });
      return;
    }

    const entry = await createBuildingBlock({
      name: uploaded.fileName,
      fileName: uploaded.fileName,
      mimeType: uploaded.mimeType,
      buffer: uploaded.buffer,
    });

    res.status(201).json({
      id: entry._id,
      name: entry.name,
      file_name: entry.file_name,
      source_type: entry.source_type,
      size_bytes: entry.size_bytes,
      preview_status: entry.preview_status,
      created_at: entry.created_at,
    });
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to save building block." });
  }
}

async function readMultipartFile(req: Request, fieldName: string): Promise<UploadedFile> {
  const contentType = req.headers["content-type"] ?? "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);

  if (!boundaryMatch) {
    throw new Error("Missing multipart boundary.");
  }

  const boundary = boundaryMatch[1] ?? boundaryMatch[2];
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks);
  const boundaryText = `--${boundary}`;
  const bodyText = body.toString("latin1");
  const parts = bodyText.split(boundaryText);

  for (const part of parts) {
    if (!part.includes(`name="${fieldName}"`)) continue;

    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;

    const rawHeaders = part.slice(0, headerEnd);
    let fileContent = part.slice(headerEnd + 4);
    fileContent = fileContent.replace(/\r\n--$/, "").replace(/\r\n$/, "");

    const fileNameMatch = rawHeaders.match(/filename="([^"]+)"/);
    const contentTypeMatch = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i);
    const fileName = fileNameMatch?.[1]?.trim();

    if (!fileName) {
      throw new Error("Uploaded file is missing a filename.");
    }

    return {
      fileName,
      mimeType: contentTypeMatch?.[1]?.trim() ?? "",
      buffer: Buffer.from(fileContent, "latin1"),
    };
  }

  throw new Error(`Missing multipart file field "${fieldName}".`);
}

function isDocxDocument(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".docx");
}
