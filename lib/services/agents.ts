import type { Agent, AgentVersion, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { agentConfigSchema, agentVersionInputSchema, idSchema, type AgentConfig, type AgentVersionInput } from "@/lib/validation";
import { requirePermission } from "@/lib/services/auth";
import { writeAuditLog, writeSecurityEvent } from "@/lib/services/audit";

export async function createAgentFromTemplate(templateId: string, orgId: string, userId: string, overrides?: Partial<AgentConfig>): Promise<Agent> {
  const parsedTemplateId = idSchema.parse(templateId);
  const config = agentConfigSchema.parse(overrides ?? {});
  await requirePermission(orgId, userId, "agent.create");

  const template = await prisma.agentTemplate.findUniqueOrThrow({ where: { id: parsedTemplateId } });
  const allTools = await prisma.toolDefinition.findMany({ where: { enabled: true } });

  const agent = await prisma.agent.create({
    data: {
      organizationId: orgId,
      templateId: template.id,
      name: config.name ?? template.name,
      description: config.description ?? template.description,
      riskLevel: config.riskLevel ?? template.defaultRiskLevel,
      visibility: config.visibility ?? "PRIVATE",
      requiresApproval: config.requiresApproval ?? false,
      maxCostPerRun: config.maxCostPerRun ?? 1,
      maxRuntimeMs: config.maxRuntimeMs ?? 30000,
      maxToolCalls: config.maxToolCalls ?? 3,
      createdByUserId: userId,
      versions: {
        create: {
          version: 1,
          name: "Initial version",
          instructions: template.defaultInstructions,
          config: template.defaultConfig as Prisma.InputJsonValue,
          status: "DRAFT",
          createdById: userId
        }
      },
      toolPermissions: { create: allTools.map((tool) => ({ toolDefinitionId: tool.id })) }
    },
    include: { versions: true }
  });

  await writeAuditLog({ organizationId: orgId, actorUserId: userId, action: "agent.create", entityType: "Agent", entityId: agent.id, metadata: { templateId } });
  return agent;
}

export async function createAgentVersion(agentId: string, userId: string, versionData: AgentVersionInput): Promise<AgentVersion> {
  const parsedAgentId = idSchema.parse(agentId);
  const data = agentVersionInputSchema.parse(versionData);
  const agent = await prisma.agent.findFirstOrThrow({ where: { id: parsedAgentId, organization: { members: { some: { userId, status: "ACTIVE" } } } } });
  await requirePermission(agent.organizationId, userId, "agent.version.create");

  const latest = await prisma.agentVersion.findFirst({ where: { agentId: agent.id }, orderBy: { version: "desc" } });
  const version = await prisma.agentVersion.create({
    data: {
      agentId: agent.id,
      version: (latest?.version ?? 0) + 1,
      name: data.name,
      instructions: data.instructions,
      config: data.config as Prisma.InputJsonValue,
      status: "DRAFT",
      createdById: userId
    }
  });

  await writeAuditLog({ organizationId: agent.organizationId, actorUserId: userId, action: "agent.version.create", entityType: "AgentVersion", entityId: version.id, metadata: { agentId: agent.id } });
  return version;
}

export async function activateAgentVersion(agentVersionId: string, userId: string): Promise<AgentVersion> {
  const parsedVersionId = idSchema.parse(agentVersionId);
  const version = await prisma.agentVersion.findFirstOrThrow({ where: { id: parsedVersionId, agent: { organization: { members: { some: { userId, status: "ACTIVE" } } } } }, include: { agent: true } });
  await requirePermission(version.agent.organizationId, userId, "agent.version.activate");

  const activated = await prisma.$transaction(async (tx) => {
    await tx.agentVersion.updateMany({ where: { agentId: version.agentId, status: "ACTIVE" }, data: { status: "ARCHIVED" } });
    const next = await tx.agentVersion.update({ where: { id: version.id }, data: { status: "ACTIVE", activatedAt: new Date() } });
    await tx.agent.update({ where: { id: version.agentId }, data: { activeVersionId: version.id } });
    return next;
  });

  await writeAuditLog({ organizationId: version.agent.organizationId, actorUserId: userId, action: "agent.version.activate", entityType: "AgentVersion", entityId: activated.id, metadata: { agentId: version.agentId } });
  return activated;
}

export async function blockHighRiskAction(orgId: string, userId: string, message: string, metadata: Record<string, unknown>) {
  await writeSecurityEvent({ organizationId: orgId, actorUserId: userId, type: "high_risk_action_blocked", severity: "high", message, metadata });
}
