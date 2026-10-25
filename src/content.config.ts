import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const runs = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/runs' }),
  schema: z.object({
    published: z.boolean().optional(),
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
        durationSeconds: z.number().optional(),
        details: z.string().optional(),
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
        cachedInput: z.string().optional(),
        output: z.string().optional(),
        thinking: z.string().optional(),
        total: z.string().optional(),
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
    commitLog: z
      .array(
        z.object({
          hash: z.string(),
          relativeTime: z.string().optional(),
          author: z.string().optional(),
          message: z.string(),
        })
      )
      .optional(),
    costBreakdown: z
      .array(
        z.object({
          component: z.string(),
          tokens: z.string(),
          rate2026: z.string().optional(),
          cost2026: z.string(),
          rate2027: z.string().optional(),
          cost2027: z.string().optional(),
        })
      )
      .optional(),
    sliceBreakdown: z
      .array(
        z.object({
          slice: z.string(),
          stepRange: z.string(),
          llmCalls: z.number(),
          manageTaskPolls: z.number().optional(),
          thinkingTokens: z.number().optional(),
          costUsd: z.number(),
        })
      )
      .optional(),
    notes: z.array(z.string()).optional(),
    notesDetails: z
      .array(
        z.object({
          title: z.string(),
          bullets: z.array(z.string()),
        })
      )
      .optional(),
  }),
});

export const collections = { runs };
