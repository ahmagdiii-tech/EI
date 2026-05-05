import { z } from "zod";

export const providerInputSchema = z.object({
  instructions: z.string().min(1),
  input: z.string().min(1),
  tools: z.array(z.string()),
  maxRuntimeMs: z.number().int().positive(),
  maxToolCalls: z.number().int().nonnegative()
});

export type ProviderInput = z.infer<typeof providerInputSchema>;
export type ProviderResult = { content: string; toolCalls: number; cost: number; metadata: Record<string, unknown> };
export type AiProvider = { generate(input: ProviderInput): Promise<ProviderResult> };

const mockProvider: AiProvider = {
  async generate(input) {
    const parsed = providerInputSchema.parse(input);
    return {
      content: `EI mock response\n\nInstructions: ${parsed.instructions.slice(0, 240)}\n\nInput: ${parsed.input}`,
      toolCalls: Math.min(parsed.tools.length, parsed.maxToolCalls),
      cost: 0,
      metadata: { provider: "mock", permittedTools: parsed.tools }
    };
  }
};

export function getAiProvider(): AiProvider {
  const provider = process.env.EI_AI_PROVIDER ?? "mock";
  if (provider !== "mock") throw new Error(`Unsupported EI provider ${provider}`);
  return mockProvider;
}
