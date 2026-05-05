import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getPermissionSet, requireCurrentOrganization } from "@/lib/services/auth";

export async function getOrgContext() {
  const organization = await requireCurrentOrganization();
  const userId = await getCurrentUserId();
  const permissions = await getPermissionSet(organization.id, userId);
  return { organization, userId, permissions };
}

export async function listTemplates() {
  return prisma.agentTemplate.findMany({ orderBy: { name: "asc" } });
}

export async function listAgents(organizationId: string) {
  return prisma.agent.findMany({ where: { organizationId }, include: { activeVersion: true, template: true }, orderBy: { createdAt: "desc" } });
}

export async function getAgent(organizationId: string, id: string) {
  return prisma.agent.findFirst({ where: { id, organizationId }, include: { activeVersion: true, versions: { orderBy: { version: "desc" } }, toolPermissions: { include: { toolDefinition: true } } } });
}

export async function listRuns(organizationId: string) {
  return prisma.run.findMany({ where: { organizationId }, include: { agentRuns: { include: { agent: true } }, finalAnswer: true }, orderBy: { createdAt: "desc" } });
}

export async function getRun(organizationId: string, id: string) {
  return prisma.run.findFirst({ where: { id, organizationId }, include: { agentRuns: { include: { agent: true, agentVersion: true } }, events: { orderBy: { createdAt: "asc" } }, finalAnswer: true } });
}
