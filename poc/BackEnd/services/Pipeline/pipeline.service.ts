import { spawn } from "child_process";
import * as path from "path";
import type { IPipelineRun } from "../../models/PipelineRun/PipelineRun";
import { getBAListById } from "../BaList/baList.service";
import { getBuildingBlockById } from "../BuildingBlock/buildingBlock.service";
import {
  createPipelineRun,
  updatePipelineRunStatus,
} from "./pipelineRun.service";
import { replacePipelineResultsForRun } from "./pipelineResult.service";

interface StartPipelineInput {
  ticketSetId: string;
  baListId?: string;
  
  buildingBlockIds?: string[];
  userPrompt?: string;
  projectContext?: {
    id?: string;
    name?: string;
    contextText?: string;
  };
}

interface PipelineStartResult {
  stdout: string;
  pipelineRun: IPipelineRun;
}

interface PipelineOutput {
  results?: unknown;
}

export async function startPipeline(input: StartPipelineInput): Promise<PipelineStartResult> {
  const pipelineDir = path.resolve(__dirname, "../../pipeline");
  const scriptPath = path.join(pipelineDir, "run_pipeline.py");
  const buildingBlockIds = input.buildingBlockIds ?? [];
  const baList = input.baListId ? await getBAListById(input.baListId) : null;
  const buildingBlocks = await Promise.all(
    buildingBlockIds.map((id) => getBuildingBlockById(id))
  );

  const pipelineRun = await createPipelineRun({
    ticketSetId: input.ticketSetId,
    baListId: input.baListId,
    baListName: baList?.name ?? "",
    buildingBlockIds,
    buildingBlockName: buildingBlocks
      .map((block) => block?.name ?? "")
      .filter(Boolean),
    userPrompt: input.userPrompt ?? "",
    projectContextId: input.projectContext?.id,
    projectContextName: input.projectContext?.name,
    projectContextText: input.projectContext?.contextText,
    llmModel: process.env.LLM_MODEL ?? "",
  });

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      let output = "";
      let errorOutput = "";
      const pythonBin = process.env.PYTHON_BIN ?? "python3";
      const proc = spawn(pythonBin, [scriptPath], {
        env: {
          ...process.env,
          PIPELINE_RUN_ID: String(pipelineRun._id),
          TICKET_SET_ID: input.ticketSetId,
          BA_LIST_ID: input.baListId ?? "",
          BUILDING_BLOCK_IDS: buildingBlockIds.join(","),
          USER_PROMPT: input.userPrompt ?? "",
          PROJECT_CONTEXT_TEXT: input.projectContext?.contextText ?? "",
        },
        cwd: pipelineDir,
      });

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });
      proc.stderr.on("data", (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error("[pipeline]", text);
      });
      proc.on("error", (err) => {
        reject(err);
      });
      proc.on("close", (code) => {
        if (code === 0) resolve(output.trim());
        else {
          const detail = errorOutput.trim();
          reject(
            new Error(
              detail
                ? `Pipeline exited with code ${code}: ${detail.slice(-2000)}`
                : `Pipeline exited with code ${code}`
            )
          );
        }
      });
    });

    const pipelineOutput = parsePipelineOutput(stdout);
    await replacePipelineResultsForRun({
      pipelineRunId: String(pipelineRun._id),
      ticketSetId: input.ticketSetId,
      results: Array.isArray(pipelineOutput.results)
        ? pipelineOutput.results
        : [],
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

function parsePipelineOutput(stdout: string): PipelineOutput {
  try {
    const parsed = JSON.parse(stdout);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Pipeline output must be a JSON object.");
    }

    return parsed as PipelineOutput;
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `Failed to parse pipeline output: ${err.message}`
        : "Failed to parse pipeline output."
    );
  }
}
