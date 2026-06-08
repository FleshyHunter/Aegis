import { loadEnv } from "./env";

loadEnv();

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export function getJiraConfig(): JiraConfig {
  const baseUrl = process.env.JIRA_BASE_URL?.trim() ?? "";
  const email = process.env.JIRA_EMAIL?.trim() ?? "";
  const apiToken = process.env.JIRA_API_TOKEN?.trim() ?? "";

  if (!baseUrl) {
    throw new Error("Missing JIRA_BASE_URL environment variable.");
  }

  if (!email) {
    throw new Error("Missing JIRA_EMAIL environment variable.");
  }

  if (!apiToken) {
    throw new Error("Missing JIRA_API_TOKEN environment variable.");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    email,
    apiToken,
  };
}
