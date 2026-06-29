import { ProjectContext } from "../../models/ProjectContext/ProjectContext";

export interface CreateProjectContextInput {
  name: string;
  description?: string;
  context_text: string;
}

export interface UpdateProjectContextInput {
  name?: string;
  description?: string;
  context_text?: string;
}

export async function getAllProjectContexts() {
  return ProjectContext.find().sort({ created_at: -1 }).lean();
}

export async function getProjectContextById(id: string) {
  return ProjectContext.findById(id).lean();
}

export async function createProjectContext(input: CreateProjectContextInput) {
  return ProjectContext.create({
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    context_text: input.context_text.trim(),
  });
}

export async function updateProjectContext(id: string, input: UpdateProjectContextInput) {
  const update: UpdateProjectContextInput = {};

  if (input.name !== undefined) update.name = input.name.trim();
  if (input.description !== undefined) update.description = input.description.trim();
  if (input.context_text !== undefined) update.context_text = input.context_text.trim();

  return ProjectContext.findByIdAndUpdate(id, update, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
}

export async function deleteProjectContext(id: string) {
  return ProjectContext.findByIdAndDelete(id).lean();
}
