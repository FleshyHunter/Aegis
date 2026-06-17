const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function runPipeline(
  input: {
    ticketSetId: string;
    baListId?: string;
    buildingBlockIds?: string[];
    userPrompt?: string;
  },
) {
  const res = await fetch(`${BASE_URL}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await assertOk(res);
  return res.json();
}

async function requestJson(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  await assertOk(res);
  return res.json();
}

async function assertOk(res: Response) {
  if (res.ok) return;

  let message = `API error: ${res.status}`;
  try {
    const body = await res.json();
    const detail = [body.error, body.detail].filter(Boolean).join(" ");
    if (detail) message = detail;
  } catch {
    const text = await res.text().catch(() => "");
    if (text) message = text;
  }

  throw new Error(message);
}

export interface BAListDetail {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  row_count: number;
  created_at: string;
}

export interface BuildingBlockDetail {
  id: string;
  name: string;
  file_name: string;
  source_type: "docx";
  mime_type: string;
  size_bytes: number;
  preview_text: string;
  preview_status: "ready" | "unsupported" | "failed";
  preview_error: string;
  created_at: string;
}

export interface EntrySummary {
  id: string;
  name: string;
  created_at: string;
}

export async function importBAList(name: string, rows: Record<string, string>[]) {
  return requestJson("/api/ba-lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rows }),
  });
}

export async function fetchBALists() {
  return requestJson("/api/ba-lists");
}

export async function fetchBAListById(id: string) {
  return requestJson(`/api/ba-lists/${id}`);
}

export async function renameBAList(id: string, name: string) {
  return requestJson(`/api/ba-lists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteBAList(id: string) {
  return requestJson(`/api/ba-lists/${id}`, {
    method: "DELETE",
  });
}

export async function fetchBuildingBlocks() {
  return requestJson("/api/building-blocks");
}

export async function fetchBuildingBlockById(id: string) {
  return requestJson(`/api/building-blocks/${id}`);
}

export async function renameBuildingBlock(id: string, name: string) {
  return requestJson(`/api/building-blocks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteBuildingBlock(id: string) {
  return requestJson(`/api/building-blocks/${id}`, {
    method: "DELETE",
  });
}

export async function uploadBuildingBlock(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson("/api/building-blocks", {
    method: "POST",
    body: formData,
  });
}

export async function fetchTicketSets() {
  return requestJson("/api/ticket-sets");
}

export async function fetchTicketSetById(id: string) {
  return requestJson(`/api/ticket-sets/${id}`);
}

export async function renameTicketSet(id: string, name: string) {
  return requestJson(`/api/ticket-sets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteTicketSet(id: string) {
  return requestJson(`/api/ticket-sets/${id}`, {
    method: "DELETE",
  });
}

export async function createTicketSet(name: string, rows: Record<string, string>[]) {
  return requestJson("/api/ticket-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rows }),
  });
}

export async function importTicketSet(
  name: string,
  sourceFilename: string,
  rows: Record<string, string>[]
) {
  return requestJson("/api/ticket-sets/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sourceFilename, rows }),
  });
}

export async function fetchDerivedTestCasesForTicketSet(id: string) {
  return requestJson(`/api/ticket-sets/${id}/derived-test-cases`);
}

export async function fetchRawTestCasesForTicketSet(id: string) {
  return requestJson(`/api/ticket-sets/${id}/raw-test-cases`);
}

export async function fetchPipelineRunsForTicketSet(id: string) {
  return requestJson(`/api/ticket-sets/${id}/pipeline-runs`);
}

export async function fetchProjectContexts() {
  return requestJson("/api/project-contexts");
}

export async function fetchProjectContextById(id: string) {
  return requestJson(`/api/project-contexts/${id}`);
}

export async function createProjectContext(input: {
  name: string;
  description: string;
  context_text: string;
  is_default: boolean;
}) {
  return requestJson("/api/project-contexts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
