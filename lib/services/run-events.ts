import type { Prisma, RunEvent } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runEventPayloadSchema = z.object({
  type: z.string().min(1),
  message: z.string().min(1),
  metadata: z.unknown().optional()
});

export type RunEventPayload = z.infer<typeof runEventPayloadSchema>;

export async function writeRunEvent(runId: string, payload: RunEventPayload): Promise<RunEvent> {
  const data = runEventPayloadSchema.parse(payload);
  return prisma.runEvent.create({
    data: {
      runId,
      type: data.type,
      message: data.message,
      metadata: data.metadata as Prisma.InputJsonValue | undefined
    }
  });
}
