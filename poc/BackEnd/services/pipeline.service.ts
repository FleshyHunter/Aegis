import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

interface Row {
  [key: string]: string;
}

interface PipelineResult {
  jira_ticket_id: string;
  test_case_id: string;
  step_id: string;
  source_result_code: string;
  ba_action: string;
  ba_reason: string;
  jira_action: string;
  jira_expectation: string;
  classification: string;
  explanation: string;
  label_hint: string;
}

function toCSV(rows: Row[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((h) => row[h] ?? "").join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

function parseCSV(text: string): Row[] {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",");
      return headers.reduce((row: Row, h, i) => {
        row[h] = values[i]?.trim() ?? "";
        return row;
      }, {});
    });
}

export async function runPipeline(
  baData: Row[],
  jiraData: Row[]
): Promise<PipelineResult[]> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "idemia-"));
  const baPath = path.join(tmpDir, "ba_truth_dataset.csv");
  const jiraPath = path.join(tmpDir, "jira_teststep_dataset.csv");
  const outputPath = path.join(tmpDir, "poc_results.csv");

  fs.writeFileSync(baPath, toCSV(baData), "utf-8");
  fs.writeFileSync(jiraPath, toCSV(jiraData), "utf-8");

  const scriptPath = path.resolve(__dirname, "../pipeline/run_poc.py");

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("python3", [scriptPath], {
      env: {
        ...process.env,
        BA_TRUTH_PATH: baPath,
        JIRA_STEPS_PATH: jiraPath,
        OUTPUT_PATH: outputPath,
        USE_MOCK_LLM: "true",
      },
      cwd: path.resolve(__dirname, "../pipeline"),
    });

    proc.stderr.on("data", (data) => console.error("[pipeline]", data.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Pipeline exited with code ${code}`));
    });
  });

  const resultCSV = fs.readFileSync(outputPath, "utf-8");
  const results = parseCSV(resultCSV) as unknown as PipelineResult[];

  fs.rmSync(tmpDir, { recursive: true, force: true });

  return results;
}
