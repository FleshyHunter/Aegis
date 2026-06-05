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

export async function importBAList(fileName: string, rows: Record<string, string>[]) {
  const res = await fetch(`${BASE_URL}/api/ba-lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, rows }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchBALists() {
  const res = await fetch(`${BASE_URL}/api/ba-lists`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchBAListById(id: string) {
  const res = await fetch(`${BASE_URL}/api/ba-lists/${id}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
