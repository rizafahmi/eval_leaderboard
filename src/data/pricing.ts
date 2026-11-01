export interface TokenRateTier {
  label: string;
  inputPerMillionUsd: number;
  cachedInputPerMillionUsd: number;
  outputPerMillionUsd: number;
  notes?: string;
}

export interface ModelPricingProfile {
  modelKey: string;
  displayName: string;
  provider: string;
  billedTier: TokenRateTier;
  standardApiTier: TokenRateTier;
  comparisonTier?: TokenRateTier;
}

export const MODEL_PRICING_CATALOG: Record<string, ModelPricingProfile> = {
  'gemini-3.8-flash-high': {
    modelKey: 'gemini-3.8-flash-high',
    displayName: 'gemini-3.8-flash-high',
    provider: 'Gemini',
    billedTier: {
      label: '2026 Standard API',
      inputPerMillionUsd: 0.75,
      cachedInputPerMillionUsd: 0.075,
      outputPerMillionUsd: 3.75,
      notes: '90% context caching discount',
    },
    standardApiTier: {
      label: '2026 Standard API',
      inputPerMillionUsd: 0.75,
      cachedInputPerMillionUsd: 0.075,
      outputPerMillionUsd: 3.75,
    },
    comparisonTier: {
      label: '2027 Standard API',
      inputPerMillionUsd: 1.5,
      cachedInputPerMillionUsd: 0.15,
      outputPerMillionUsd: 7.5,
    },
  },
  'gpt-6-sol': {
    modelKey: 'gpt-6-sol',
    displayName: 'gpt-6-sol',
    provider: 'OpenAI Codex',
    billedTier: {
      label: 'gpt-6-sol API (90% cache off)',
      inputPerMillionUsd: 2.0,
      cachedInputPerMillionUsd: 0.2,
      outputPerMillionUsd: 10.0,
    },
    standardApiTier: {
      label: 'gpt-6-sol API',
      inputPerMillionUsd: 2.0,
      cachedInputPerMillionUsd: 0.2,
      outputPerMillionUsd: 10.0,
    },
    comparisonTier: {
      label: 'gpt-6.1-sol API (95% cache off)',
      inputPerMillionUsd: 2.0,
      cachedInputPerMillionUsd: 0.1,
      outputPerMillionUsd: 10.0,
    },
  },
  'gpt-6.1-sol': {
    modelKey: 'gpt-6.1-sol',
    displayName: 'gpt-6.1-sol',
    provider: 'OpenAI Codex',
    billedTier: {
      label: 'gpt-6.1-sol API (95% cache off)',
      inputPerMillionUsd: 2.0,
      cachedInputPerMillionUsd: 0.1,
      outputPerMillionUsd: 10.0,
    },
    standardApiTier: {
      label: 'gpt-6.1-sol API',
      inputPerMillionUsd: 2.0,
      cachedInputPerMillionUsd: 0.1,
      outputPerMillionUsd: 10.0,
    },
    comparisonTier: {
      label: 'gpt-6-sol API (90% cache off)',
      inputPerMillionUsd: 2.0,
      cachedInputPerMillionUsd: 0.2,
      outputPerMillionUsd: 10.0,
    },
  },
  'auto (grok-4.5)': {
    modelKey: 'auto (grok-4.5)',
    displayName: 'auto (grok-4.5)',
    provider: 'Cursor',
    billedTier: {
      label: 'Cursor Included Free Tier',
      inputPerMillionUsd: 0,
      cachedInputPerMillionUsd: 0,
      outputPerMillionUsd: 0,
    },
    standardApiTier: {
      label: 'Cursor Auto API',
      inputPerMillionUsd: 1.25,
      cachedInputPerMillionUsd: 0.25,
      outputPerMillionUsd: 6.0,
    },
    comparisonTier: {
      label: 'Cursor Auto API',
      inputPerMillionUsd: 1.25,
      cachedInputPerMillionUsd: 0.25,
      outputPerMillionUsd: 6.0,
    },
  },
  'openrouter/laguna-s-2.1:free': {
    modelKey: 'openrouter/laguna-s-2.1:free',
    displayName: 'openrouter/laguna-s-2.1:free',
    provider: 'Poolside',
    billedTier: {
      label: 'OpenRouter :free Tier',
      inputPerMillionUsd: 0,
      cachedInputPerMillionUsd: 0,
      outputPerMillionUsd: 0,
    },
    standardApiTier: {
      label: 'OpenRouter :free Tier',
      inputPerMillionUsd: 0,
      cachedInputPerMillionUsd: 0,
      outputPerMillionUsd: 0,
    },
  },
  'muse-spark-1.3-contributor': {
    modelKey: 'muse-spark-1.3-contributor',
    displayName: 'muse-spark-1.3-contributor',
    provider: 'Meta',
    billedTier: {
      label: '2026 Contributor API (98% cache off)',
      inputPerMillionUsd: 0.1,
      cachedInputPerMillionUsd: 0.002,
      outputPerMillionUsd: 0.2,
    },
    standardApiTier: {
      label: '2026 Contributor API',
      inputPerMillionUsd: 0.1,
      cachedInputPerMillionUsd: 0.002,
      outputPerMillionUsd: 0.2,
    },
  },
  'glm-5.3-flash': {
    modelKey: 'glm-5.3-flash',
    displayName: 'glm-5.3-flash',
    provider: 'Z.ai',
    billedTier: {
      label: '2026 Z.ai Flash API',
      inputPerMillionUsd: 0.15,
      cachedInputPerMillionUsd: 0.03,
      outputPerMillionUsd: 0.5,
    },
    standardApiTier: {
      label: '2026 Z.ai Flash API',
      inputPerMillionUsd: 0.15,
      cachedInputPerMillionUsd: 0.03,
      outputPerMillionUsd: 0.5,
    },
  },
  'glm-5.3': {
    modelKey: 'glm-5.3',
    displayName: 'glm-5.3',
    provider: 'Z.ai',
    billedTier: {
      label: '2026 Z.ai Flagship API',
      inputPerMillionUsd: 1.4,
      cachedInputPerMillionUsd: 0.26,
      outputPerMillionUsd: 4.4,
    },
    standardApiTier: {
      label: '2026 Z.ai Flagship API',
      inputPerMillionUsd: 1.4,
      cachedInputPerMillionUsd: 0.26,
      outputPerMillionUsd: 4.4,
    },
  },
};

export interface NumericTokenBag {
  uncachedInput: number;
  cachedInput: number;
  output: number;
  thinking?: number;
  total?: number;
}

export interface ComputedCostMetrics {
  profile: ModelPricingProfile | null;
  billedCostUsd: number;
  standardApiCostUsd: number;
  uncachedCounterfactualCostUsd: number;
  cacheSavingsUsd: number;
  cacheSavingsPct: number;
  comparisonCostUsd: number | null;
  comparisonLabel: string | null;
}

export function computeTierCostUsd(tokens: NumericTokenBag, tier: TokenRateTier): number {
  const inputCost = (tokens.uncachedInput / 1_000_000) * tier.inputPerMillionUsd;
  const cachedCost = (tokens.cachedInput / 1_000_000) * tier.cachedInputPerMillionUsd;
  const outputCost = (tokens.output / 1_000_000) * tier.outputPerMillionUsd;
  return inputCost + cachedCost + outputCost;
}

export function computeUncachedCounterfactualUsd(
  tokens: NumericTokenBag,
  tier: TokenRateTier
): number {
  const allPromptTokens = tokens.uncachedInput + tokens.cachedInput;
  const promptCost = (allPromptTokens / 1_000_000) * tier.inputPerMillionUsd;
  const outputCost = (tokens.output / 1_000_000) * tier.outputPerMillionUsd;
  return promptCost + outputCost;
}

export function getModelPricingProfile(model: string): ModelPricingProfile | null {
  const normalized = model.trim().toLowerCase();
  for (const [key, profile] of Object.entries(MODEL_PRICING_CATALOG)) {
    if (key.toLowerCase() === normalized) {
      return profile;
    }
  }
  return null;
}

export function computeCostEconometrics(
  tokens: NumericTokenBag,
  model: string,
  recordedCostUsd: number
): ComputedCostMetrics {
  const profile = getModelPricingProfile(model);
  if (!profile) {
    return {
      profile: null,
      billedCostUsd: recordedCostUsd,
      standardApiCostUsd: recordedCostUsd,
      uncachedCounterfactualCostUsd: recordedCostUsd,
      cacheSavingsUsd: 0,
      cacheSavingsPct: 0,
      comparisonCostUsd: null,
      comparisonLabel: null,
    };
  }

  const billedCostUsd = Number(computeTierCostUsd(tokens, profile.billedTier).toFixed(4));
  const standardApiCostUsd = Number(
    computeTierCostUsd(tokens, profile.standardApiTier).toFixed(4)
  );
  const uncachedCounterfactualCostUsd = Number(
    computeUncachedCounterfactualUsd(tokens, profile.standardApiTier).toFixed(4)
  );
  const cacheSavingsUsd = Math.max(
    0,
    Number((uncachedCounterfactualCostUsd - standardApiCostUsd).toFixed(4))
  );
  const cacheSavingsPct =
    uncachedCounterfactualCostUsd > 0
      ? Number(((cacheSavingsUsd / uncachedCounterfactualCostUsd) * 100).toFixed(1))
      : 0;
  const comparisonCostUsd = profile.comparisonTier
    ? Number(computeTierCostUsd(tokens, profile.comparisonTier).toFixed(4))
    : null;

  return {
    profile,
    billedCostUsd,
    standardApiCostUsd,
    uncachedCounterfactualCostUsd,
    cacheSavingsUsd,
    cacheSavingsPct,
    comparisonCostUsd,
    comparisonLabel: profile.comparisonTier?.label ?? null,
  };
}
