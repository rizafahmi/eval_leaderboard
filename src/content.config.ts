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
    agentPlanCompletion: z.record(z.string(), z.boolean()).optional(),
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
    tokenCounts: z
      .object({
        uncachedInput: z.number(),
        cachedInput: z.number(),
        output: z.number(),
        thinking: z.number().optional(),
        total: z.number(),
        cacheHitRatePct: z.number(),
      })
      .optional(),
    contextWindow: z.string().optional(),
    contextMetrics: z
      .object({
        minTokens: z.number().optional(),
        avgTokens: z.number().optional(),
        peakTokens: z.number(),
        windowLimitTokens: z.number().optional(),
        peakUtilizationPct: z.number().optional(),
      })
      .optional(),
    verification: z
      .object({
        holdoutPassed: z.number(),
        holdoutTotal: z.number(),
        holdoutVerdict: z.enum(['full-pass', 'partial-pass', 'zero-pass']),
        agentClaimedPassed: z.number().optional(),
        agentClaimedTotal: z.number().optional(),
        unverifiedSlices: z.array(z.string()).optional(),
        agentSuitePassed: z.number().optional(),
        agentSuiteTotal: z.number().optional(),
      })
      .optional(),
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

const badgeSchema = z.object({
  text: z.string(),
  tone: z.enum(['acid', 'violet', 'mint', 'sky', 'magenta', 'outline']),
});

const statCardSchema = z.object({
  label: z.string(),
  value: z.string(),
  sub: z.string(),
  accent: z.boolean().optional(),
});

const slideCommon = {
  id: z.string(),
  label: z.string(),
  filename: z.string(),
  badges: z.array(badgeSchema),
  headlinePrimary: z.string(),
  headlineMuted: z.string(),
  footerRight: z.string().optional(),
};

const insightSlideSchema = z.discriminatedUnion('kind', [
  z.object({
    ...slideCommon,
    kind: z.literal('cover'),
    lead: z.string().optional(),
    stats: z.array(statCardSchema).min(2).max(3),
  }),
  z.object({
    ...slideCommon,
    kind: z.literal('metrics'),
    splitBar: z.object({
      label: z.string(),
      primaryLabel: z.string(),
      primaryPct: z.number(),
      secondaryLabel: z.string(),
      secondaryPct: z.number(),
    }),
    stats: z.array(statCardSchema).length(4),
  }),
  z.object({
    ...slideCommon,
    kind: z.literal('comparison'),
    columns: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    rows: z.array(
      z.object({
        metric: z.string(),
        primary: z.string(),
        baseline: z.string(),
        delta: z.string(),
        deltaTone: z.enum(['acid', 'violet', 'mint', 'sky', 'magenta']),
      })
    ),
    barCompare: z.object({
      label: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
          widthPct: z.number(),
          accent: z.boolean().optional(),
        })
      ),
    }),
    footnote: z.string().optional(),
  }),
  z.object({
    ...slideCommon,
    kind: z.literal('steps'),
    steps: z.array(
      z.object({
        num: z.string(),
        title: z.string(),
        desc: z.string(),
      })
    ),
    callout: z
      .object({
        title: z.string(),
        body: z.string(),
        tone: z.enum(['violet', 'acid', 'sky']).optional(),
      })
      .optional(),
  }),
  z.object({
    ...slideCommon,
    kind: z.literal('caveats'),
    items: z.array(
      z.object({
        num: z.string(),
        head: z.string(),
        text: z.string(),
      })
    ),
  }),
  z.object({
    ...slideCommon,
    kind: z.literal('takeaways'),
    items: z.array(
      z.object({
        num: z.string(),
        head: z.string(),
        text: z.string(),
      })
    ),
    archive: z.object({
      label: z.string(),
      body: z.string(),
      url: z.string(),
    }),
  }),
]);

const insight = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/insight' }),
  schema: z.object({
    published: z.boolean().default(true),
    order: z.number(),
    part: z.string(),
    date: z.string(),
    lang: z.enum(['en', 'id']).default('en'),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    seoTitle: z.string().max(47).optional(),
    seoDescription: z.string().max(160).optional(),
    brandLabel: z.string().default('EVAL.RIZAFAHMI.COM'),
    footerLeft: z.string().default('@rizafahmi · Personal Eval'),
    defaultRatio: z.enum(['4:5', '1:1']).default('4:5'),
    tags: z.array(z.string()).default([]),
    relatedRunIds: z.array(z.string()).default([]),
    slides: z.array(insightSlideSchema).min(1),
  }),
});

export const collections = { runs, insight };
