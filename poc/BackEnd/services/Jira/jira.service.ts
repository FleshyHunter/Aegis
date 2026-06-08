import { getJiraConfig } from "../../config/jira.config";

interface JiraRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

export async function jiraRequest<T>(
  apiPath: string,
  options: JiraRequestOptions = {}
): Promise<T> {
  const config = getJiraConfig();
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");

  const response = await fetch(`${config.baseUrl}${apiPath}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Jira API error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchJiraIssue(issueKey: string): Promise<unknown> {
  return jiraRequest(`/rest/api/3/issue/${encodeURIComponent(issueKey)}`);
}
