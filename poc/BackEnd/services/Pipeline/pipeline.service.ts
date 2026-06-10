import { spawn } from "child_process";
import * as path from "path";

interface StartPipelineInput {
  ticketSetId: string;
  baListId?: string;
  buildingBlockIds?: string[];
  userPrompt?: string;
}

interface PipelineStartResult {
  stdout: string;
}

export async function startPipeline(input: StartPipelineInput): Promise<PipelineStartResult> {
  const pipelineDir = path.resolve(__dirname, "../../pipeline");
  const scriptPath = path.join(pipelineDir, "run_pipeline.py");

  const stdout = await new Promise<string>((resolve, reject) => {
    let output = "";
    const proc = spawn("python3", [scriptPath], {
      env: {
        ...process.env,
        TICKET_SET_ID: input.ticketSetId,
        BA_LIST_ID: input.baListId ?? "",
        BUILDING_BLOCK_IDS: input.buildingBlockIds?.join(",") ?? "",
        USER_PROMPT: input.userPrompt ?? "",
      },
      cwd: pipelineDir,
    });

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });
    proc.stderr.on("data", (data) => console.error("[pipeline]", data.toString()));
    proc.on("error", (err) => {
      reject(err);
    });
    proc.on("close", (code) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error(`Pipeline exited with code ${code}`));
    });
  });

  return { stdout };
}
