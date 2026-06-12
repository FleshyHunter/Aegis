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

export async function fetchBuildingBlocks() {
  return requestJson("/api/building-blocks");
}

export async function fetchBuildingBlockById(id: string) {
  return requestJson(`/api/building-blocks/${id}`);
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
