import {
  DerivedTestCase,
  type DerivedTestCaseTableRow,
  type IDerivedTestCase,
  type RawStepRow,
  type ResultCodeSource,
  type TitleConventionStatus,
} from "../../models/DerivedTestCase/DerivedTestCase";
import type { IRawTestCase, SourceTestCaseRow } from "../../models/RawTestCase/RawTestCase";

interface DerivedStep {
  step: number;
  action: string;
  expected: string[];
}

interface ResultCodeParse {
  value: string;
  source: ResultCodeSource;
}

const DERIVED_COLUMNS = [
  "jira_ticket_id",
  "test_case_id",
  "title_raw",
  "product_name",
  "title_brackets",
  "result_code",
  "result_code_source",
  "title_convention_status",
  "title_parse_warnings",
  "test_case_name",
  "type",
  "components",
  "labels",
  "execution_type",
  "test_repo_path",
  "status",
  "resolution",
  "fix_versions",
  "description_raw",
  "description_context",
  "preconditions",
  "steps_raw",
  "steps",
  "label_hint",
  "routing_key",
];

export async function createDerivedTestCaseTableFromRaw(
  rawTestCase: IRawTestCase
): Promise<IDerivedTestCase> {
  const rows = rawTestCase.rows.map((row) => buildDerivedRow(row));

  return DerivedTestCase.create({
    ticket_set_id: rawTestCase.ticket_set_id,
    raw_test_case_id: rawTestCase._id,
    name: `${rawTestCase.name} derived`,
    source_filename: rawTestCase.source_filename,
    columns: DERIVED_COLUMNS,
    rows,
    row_count: rows.length,
  });
}

export async function getDerivedTestCaseTableByTicketSetId(ticketSetId: string) {
  return DerivedTestCase.findOne({ ticket_set_id: ticketSetId }).lean();
}

function buildDerivedRow(row: SourceTestCaseRow): DerivedTestCaseTableRow {
  const titleRaw = getFirstValue(row, ["title_raw", "title", "summary"]);
  const brackets = extractTitleBrackets(titleRaw);
  const resultCode = getResultCode(titleRaw, brackets);
  const descriptionRaw = getFirstValue(row, ["description_raw", "description"]);
  const stepsRaw = parseStepsRaw(getFirstRawValue(row, ["steps_raw", "steps"]));

  return {
    jira_ticket_id: getFirstValue(row, ["jira_ticket_id", "ticket_id", "jira_key", "issue_key", "key"]),
    test_case_id: getFirstValue(row, ["test_case_id", "testcase_id", "test_id", "case_id"]),
    title_raw: titleRaw,
    product_name: brackets[0] ?? "",
    title_brackets: brackets,
    result_code: resultCode.value,
    result_code_source: resultCode.source,
    title_convention_status: getTitleConventionStatus(titleRaw, brackets),
    title_parse_warnings: getTitleWarnings(titleRaw, brackets, resultCode.value),
    test_case_name: stripTitleBrackets(titleRaw),
    type: getFirstValue(row, ["type", "issue_type"]),
    components: splitList(getFirstValue(row, ["components"])),
    labels: splitList(getFirstValue(row, ["labels"])),
    execution_type: getFirstValue(row, ["execution_type"]),
    test_repo_path: getFirstValue(row, ["test_repo_path"]),
    status: getFirstValue(row, ["status"]),
    resolution: getFirstValue(row, ["resolution"]),
    fix_versions: splitList(getFirstValue(row, ["fix_versions", "fix_version"])),
    description_raw: descriptionRaw,
    description_context: extractDescriptionContext(descriptionRaw),
    preconditions: extractPreconditions(descriptionRaw),
    steps_raw: stepsRaw,
    steps: deriveSteps(stepsRaw),
    label_hint: normalizeLabelHint(getFirstValue(row, ["label_hint"])),
    routing_key: null,
  };
}

function parseStepsRaw(value: unknown): RawStepRow[] {
  if (value == null) return [];

  let parsed: unknown = value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      throw new Error(
        `steps_raw is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("steps_raw must be an array or a JSON string representing an array");
  }

  return parsed.map((entry, index): RawStepRow => {
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new Error(
        `steps_raw row ${index + 1} must be a two-item array: [action, expectedText]`
      );
    }

    const [action, expectedText] = entry;
    return [
      action == null ? "" : String(action).trim(),
      expectedText == null ? "" : String(expectedText),
    ];
  });
}

function deriveSteps(stepsRaw: unknown): DerivedStep[] {
  return parseStepsRaw(stepsRaw).map(([action, expectedBlob], index): DerivedStep => ({
    step: index + 1,
    action,
    expected: splitExpectedResults(expectedBlob),
  }));
}

function getFirstValue(row: SourceTestCaseRow, keys: string[]): string {
  const value = getFirstRawValue(row, keys);
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function getFirstRawValue(row: SourceTestCaseRow, keys: string[]): unknown {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value])
  );

  for (const key of keys) {
    const value = normalized[normalizeKey(key)];
    if (value == null) continue;
    if (typeof value === "string" && !value.trim()) continue;
    return value;
  }

  return "";
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeLabelHint(value: string): "Pass" | "Failed" | "Skipped" | "" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "pass" || normalized === "passed" || normalized === "match") return "Pass";
  if (normalized === "failed" || normalized === "fail" || normalized === "mismatch") return "Failed";
  if (normalized === "skipped" || normalized === "skip") return "Skipped";
  return "";
}

function extractTitleBrackets(title: string): string[] {
  return [...title.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim());
}

function getResultCode(
  title: string,
  brackets: string[]
): ResultCodeParse {
  if (brackets[1]) {
    return { value: brackets[1], source: "title_brackets[1]" };
  }

  const bracketMatch = brackets.find((value) => /[A-Z]{1,5}\d{1,6}/i.test(value));
  if (bracketMatch) {
    return { value: bracketMatch, source: "fallback_bracket_scan" };
  }

  const titleMatch = title.match(/[A-Z]{1,5}\d{1,6}/i);
  if (titleMatch) {
    return { value: titleMatch[0], source: "fallback_title_text" };
  }

  return { value: "", source: "not_found" };
}

function getTitleConventionStatus(title: string, brackets: string[]): TitleConventionStatus {
  if (!title.trim()) return "invalid";
  if (!brackets.length) return "invalid";
  return brackets.length >= 2 ? "standard" : "outlier";
}

function getTitleWarnings(title: string, brackets: string[], resultCode: string): string[] {
  const warnings: string[] = [];
  if (!title.trim()) warnings.push("Missing title_raw.");
  if (brackets.length < 2) warnings.push("Expected at least two title bracket values.");
  if (!resultCode) warnings.push("Result code could not be extracted.");
  return warnings;
}

function stripTitleBrackets(title: string): string {
  return title.replace(/^(\s*\[[^\]]+\])+\s*/, "").trim();
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractDescriptionContext(description: string): string {
  const [context] = normalizeLineBreaks(description).split(/preconditions\s*:/i);
  return context.trim();
}

function extractPreconditions(description: string): string[] {
  const normalized = normalizeLineBreaks(description);
  const match = normalized.match(/preconditions\s*:\s*([\s\S]*)/i);
  if (!match) return [];

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+.+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function splitExpectedResults(expected: string): string[] {
  return normalizeLineBreaks(expected)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeLineBreaks(value: string): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n");
}
