import { z } from "zod";

export const idSchema = z.string().min(1);
export const permissionKeySchema = z.string().min(1);
export const runInputSchema = z.string().min(1).max(12000);

export const agentConfigSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  visibility: z.enum(["PRIVATE", "ORGANIZATION"]).optional(),
  requiresApproval: z.boolean().optional(),
  maxCostPerRun: z.number().nonnegative().max(100).optional(),
  maxRuntimeMs: z.number().int().positive().max(300000).optional(),
  maxToolCalls: z.number().int().nonnegative().max(25).optional()
});

export const agentVersionInputSchema = z.object({
  name: z.string().min(1).max(120),
  instructions: z.string().min(1).max(50000),
  config: z.record(z.string(), z.unknown()).default({})
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type AgentVersionInput = z.infer<typeof agentVersionInputSchema>;
