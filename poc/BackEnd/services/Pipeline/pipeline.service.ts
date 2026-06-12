import { spawn } from "child_process";
import * as path from "path";
import type { IPipelineRun } from "../../models/PipelineRun/PipelineRun";
import {
  createPipelineRun,
  updatePipelineRunStatus,
} from "./pipelineRun.service";

interface StartPipelineInput {
  ticketSetId: string;
  baListId: string;
  buildingBlockIds?: string[];
  userPrompt?: string;
}

interface PipelineStartResult {
  stdout: string;
  pipelineRun: IPipelineRun;
}

export async function startPipeline(input: StartPipelineInput): Promise<PipelineStartResult> {
  const pipelineDir = path.resolve(__dirname, "../../pipeline");
  const scriptPath = path.join(pipelineDir, "run_pipeline.py");
  const buildingBlockIds = input.buildingBlockIds ?? [];
  const pipelineRun = await createPipelineRun({
    ticketSetId: input.ticketSetId,
    baListId: input.baListId,
    buildingBlockIds,
    userPrompt: input.userPrompt ?? "",
    llmModel: process.env.LLM_MODEL ?? "",
  });

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      let output = "";
      const proc = spawn("python3", [scriptPath], {
        env: {
          ...process.env,
          PIPELINE_RUN_ID: String(pipelineRun._id),
          TICKET_SET_ID: input.ticketSetId,
          BA_LIST_ID: input.baListId,
          BUILDING_BLOCK_IDS: buildingBlockIds.join(","),
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

    const completedRun = await updatePipelineRunStatus(
      String(pipelineRun._id),
      "completed"
    );

    return {
      stdout,
      pipelineRun: completedRun ?? pipelineRun,
    };
  } catch (err) {
    await updatePipelineRunStatus(String(pipelineRun._id), "failed", {
      errorMessage: err instanceof Error ? err.message : "Unknown pipeline error.",
    });
    throw err;
  }
}
