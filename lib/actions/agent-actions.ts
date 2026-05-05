"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAgentFromTemplate } from "@/lib/services/agents";
import { getCurrentUserId, requireCurrentOrganization } from "@/lib/services/auth";
import { runSingleAgent } from "@/lib/services/runtime";

const createAgentActionSchema = z.object({ templateId: z.string().min(1), name: z.string().min(1).max(120).optional() });
const runAgentActionSchema = z.object({ agentId: z.string().min(1), input: z.string().min(1).max(12000) });

export async function createAgentAction(formData: FormData) {
  const org = await requireCurrentOrganization();
  const userId = await getCurrentUserId();
  const data = createAgentActionSchema.parse({
    templateId: formData.get("templateId"),
    name: formData.get("name") || undefined
  });
  const agent = await createAgentFromTemplate(data.templateId, org.id, userId, { name: data.name });
  revalidatePath("/agents");
  redirect(`/agents/${agent.id}`);
}

export async function runAgentAction(formData: FormData) {
  const userId = await getCurrentUserId();
  const data = runAgentActionSchema.parse({ agentId: formData.get("agentId"), input: formData.get("input") });
  const run = await runSingleAgent(data.agentId, userId, data.input);
  revalidatePath("/runs");
  redirect(`/runs/${run.id}`);
}
