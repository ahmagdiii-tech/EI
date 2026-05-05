import type { Organization } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { permissionKeySchema } from "@/lib/validation";
import { writeSecurityEvent } from "@/lib/services/audit";

export class PermissionDeniedError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export async function requireCurrentOrganization(): Promise<Organization> {
  const slug = process.env.EI_DEMO_ORG_SLUG ?? "ei-demo";
  return prisma.organization.findUniqueOrThrow({ where: { slug } });
}

export async function getCurrentUserId(): Promise<string> {
  const email = process.env.EI_DEMO_USER_EMAIL ?? "owner@ei.local";
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return user.id;
}

export async function getPermissionSet(orgId: string, userId: string): Promise<Set<string>> {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  });
  if (!member || member.status !== "ACTIVE") return new Set();
  return new Set(member.roles.flatMap((memberRole) => memberRole.role.permissions.map((rolePermission) => rolePermission.permission.key)));
}

export async function requirePermission(orgId: string, userId: string, permissionKey: string): Promise<void> {
  const key = permissionKeySchema.parse(permissionKey);
  const permissions = await getPermissionSet(orgId, userId);
  if (!permissions.has(key)) {
    await writeSecurityEvent({
      organizationId: orgId,
      actorUserId: userId,
      type: "permission_denied",
      severity: "medium",
      message: `Denied permission ${key}`,
      metadata: { permissionKey: key }
    });
    throw new PermissionDeniedError(`Missing permission ${key}`);
  }
}
