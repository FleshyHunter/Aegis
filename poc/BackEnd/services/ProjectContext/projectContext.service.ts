import { ProjectContext } from "../../models/ProjectContext/ProjectContext";

export interface CreateProjectContextInput {
  name: string;
  description?: string;
  context_text: string;
  is_default?: boolean;
}

export interface UpdateProjectContextInput {
  name?: string;
  description?: string;
  context_text?: string;
  is_default?: boolean;
}

export async function getAllProjectContexts() {
  return ProjectContext.find().sort({ created_at: -1 }).lean();
}

export async function getProjectContextById(id: string) {
  return ProjectContext.findById(id).lean();
}

export async function createProjectContext(input: CreateProjectContextInput) {
  if (input.is_default) {
    await clearDefaultProjectContext();
  }

  return ProjectContext.create({
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    context_text: input.context_text.trim(),
    is_default: Boolean(input.is_default),
  });
}

export async function updateProjectContext(id: string, input: UpdateProjectContextInput) {
  const update: UpdateProjectContextInput = {};

  if (input.name !== undefined) update.name = input.name.trim();
  if (input.description !== undefined) update.description = input.description.trim();
  if (input.context_text !== undefined) update.context_text = input.context_text.trim();
  if (input.is_default !== undefined) update.is_default = input.is_default;

  if (update.is_default) {
    await clearDefaultProjectContext(id);
  }

  return ProjectContext.findByIdAndUpdate(id, update, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
}

export async function deleteProjectContext(id: string) {
  return ProjectContext.findByIdAndDelete(id).lean();
}

async function clearDefaultProjectContext(excludeId?: string): Promise<void> {
  const filter = excludeId
    ? { _id: { $ne: excludeId }, is_default: true }
    : { is_default: true };

  await ProjectContext.updateMany(filter, { $set: { is_default: false } });
}
