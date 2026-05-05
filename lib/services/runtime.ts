import type { Run } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAiProvider } from "@/lib/ai/provider";
import { runInputSchema, idSchema } from "@/lib/validation";
import { requirePermission } from "@/lib/services/auth";
import { writeAuditLog } from "@/lib/services/audit";
import { writeRunEvent } from "@/lib/services/run-events";
import { blockHighRiskAction } from "@/lib/services/agents";

export async function runSingleAgent(agentId: string, userId: string, input: string): Promise<Run> {
  const parsedAgentId = idSchema.parse(agentId);
  const parsedInput = runInputSchema.parse(input);
  const agent = await prisma.agent.findUniqueOrThrow({
    where: { id: parsedAgentId, organization: { members: { some: { userId, status: "ACTIVE" } } } },
    include: { activeVersion: true, toolPermissions: { include: { toolDefinition: true } } }
  });

  await requirePermission(agent.organizationId, userId, "agent.run");

  if (!agent.activeVersion) {
    await blockHighRiskAction(agent.organizationId, userId, "Blocked run without an active agent version", { agentId: agent.id });
    throw new Error("Agent has no active version");
  }

  if (agent.requiresApproval || agent.riskLevel === "HIGH") {
    await blockHighRiskAction(agent.organizationId, userId, "Blocked run that requires approval", { agentId: agent.id, riskLevel: agent.riskLevel });
    const blockedRun = await prisma.run.create({ data: { organizationId: agent.organizationId, requestedById: userId, input: parsedInput, status: "BLOCKED" } });
    await writeRunEvent(blockedRun.id, { type: "blocked", message: "Run blocked by EI runtime policy", metadata: { agentId: agent.id } });
    return blockedRun;
  }

  const run = await prisma.run.create({ data: { organizationId: agent.organizationId, requestedById: userId, input: parsedInput, status: "RUNNING", startedAt: new Date() } });
  const agentRun = await prisma.agentRun.create({ data: { runId: run.id, agentId: agent.id, agentVersionId: agent.activeVersion.id, status: "RUNNING", startedAt: new Date() } });
  await writeRunEvent(run.id, { type: "run.started", message: "EI run started", metadata: { agentId: agent.id, agentRunId: agentRun.id } });

  const tools = agent.toolPermissions.map((permission) => permission.toolDefinition.key);
  const provider = getAiProvider();
  const result = await provider.generate({ instructions: agent.activeVersion.instructions, input: parsedInput, tools, maxRuntimeMs: agent.maxRuntimeMs, maxToolCalls: agent.maxToolCalls });

  if (result.cost > Number(agent.maxCostPerRun) || result.toolCalls > agent.maxToolCalls) {
    await blockHighRiskAction(agent.organizationId, userId, "Blocked provider result over runtime limits", { agentId: agent.id, result });
    await prisma.run.update({ where: { id: run.id }, data: { status: "BLOCKED", completedAt: new Date() } });
    await prisma.agentRun.update({ where: { id: agentRun.id }, data: { status: "BLOCKED", completedAt: new Date() } });
    await writeRunEvent(run.id, { type: "blocked", message: "Provider result exceeded EI runtime limits", metadata: result });
    return prisma.run.findUniqueOrThrow({ where: { id: run.id } });
  }

  await prisma.finalAnswer.create({ data: { runId: run.id, content: result.content, metadata: result.metadata } });
  await writeRunEvent(run.id, { type: "run.completed", message: "EI run completed", metadata: { cost: result.cost, toolCalls: result.toolCalls } });
  await prisma.agentRun.update({ where: { id: agentRun.id }, data: { status: "SUCCEEDED", completedAt: new Date() } });
  const completed = await prisma.run.update({ where: { id: run.id }, data: { status: "SUCCEEDED", completedAt: new Date() } });

  await writeAuditLog({ organizationId: agent.organizationId, actorUserId: userId, action: "agent.run", entityType: "Run", entityId: run.id, metadata: { agentId: agent.id } });
  return completed;
}
