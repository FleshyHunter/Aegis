const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function runPipeline(baData: Record<string, string>[], jiraData: Record<string, string>[]) {
  const res = await fetch(`${BASE_URL}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baData, jiraData }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function requestJson(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function importBAList(fileName: string, rows: Record<string, string>[]) {
  return requestJson("/api/ba-lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, rows }),
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

export async function createBuildingBlock(name: string, rows: Record<string, string>[]) {
  return requestJson("/api/building-blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rows }),
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
