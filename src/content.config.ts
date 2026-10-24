import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const runs = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/runs' }),
  schema: z.object({
    timestamp: z.string(),
    codingHarness: z.string(),
    model: z.string(),
    effort: z.string().optional(),
    provider: z.string(),
    durationMinutes: z.number(),
    costUsd: z.number(),
    commits: z.number().optional(),
    tests: z
      .object({
        passed: z.number(),
        total: z.number(),
      })
      .optional(),
    planCompletion: z.record(z.string(), z.boolean()),
    interface: z
      .object({
        type: z.enum(['cli', 'desktop', 'web']).optional(),
        command: z.string().optional(),
        details: z.string().optional(),
      })
      .optional(),
    tokens: z
      .object({
        input: z.string().optional(),
        output: z.string().optional(),
        cacheHitRate: z.string().optional(),
      })
      .optional(),
    contextWindow: z.string().optional(),
    calls: z
      .object({
        llmCalls: z.number().optional(),
        toolCalls: z
          .object({
            total: z.number().optional(),
            done: z.number().optional(),
            error: z.number().optional(),
            breakdown: z
              .array(
                z.object({
                  tool: z.string(),
                  total: z.number(),
                  done: z.number().optional(),
                  error: z.number().optional(),
                })
              )
              .optional(),
          })
          .optional(),
      })
      .optional(),
    notes: z.array(z.string()).optional(),
  }),
});

export const collections = { runs };
