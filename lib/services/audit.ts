import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const jsonSchema = z.unknown().optional();

export const auditLogPayloadSchema = z.object({
  organizationId: z.string().min(1),
  actorUserId: z.string().min(1).optional(),
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1).optional(),
  metadata: jsonSchema
});

export const securityEventPayloadSchema = z.object({
  organizationId: z.string().min(1),
  actorUserId: z.string().min(1).optional(),
  type: z.string().min(1),
  severity: z.string().min(1),
  message: z.string().min(1),
  metadata: jsonSchema
});

export type AuditLogPayload = z.infer<typeof auditLogPayloadSchema>;
export type SecurityEventPayload = z.infer<typeof securityEventPayloadSchema>;

export async function writeAuditLog(payload: AuditLogPayload) {
  const data = auditLogPayloadSchema.parse(payload);
  return prisma.auditLog.create({
    data: {
      ...data,
      actorUserId: data.actorUserId ?? null,
      entityId: data.entityId ?? null,
      metadata: data.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

export async function writeSecurityEvent(payload: SecurityEventPayload) {
  const data = securityEventPayloadSchema.parse(payload);
  return prisma.securityEvent.create({
    data: {
      ...data,
      actorUserId: data.actorUserId ?? null,
      metadata: data.metadata as Prisma.InputJsonValue | undefined
    }
  });
}
