import type { ModelPricingRule } from "./types.js";

export const DEFAULT_PRICING_RULES: ModelPricingRule[] = [
  {
    id: "gemini-2.5-pro",
    pattern: "gemini-2.5-pro*",
    label: "Gemini 2.5 Pro",
    inputPer1M: 1.25,
    cacheReadPer1M: 0.3125,
    outputPer1M: 10.0,
    enabled: true
  },
  {
    id: "gemini-2.5-flash",
    pattern: "gemini-2.5-flash*",
    label: "Gemini 2.5 Flash",
    inputPer1M: 0.15,
    cacheReadPer1M: 0.0375,
    outputPer1M: 0.6,
    enabled: true
  },
  {
    id: "gemini-2.0-flash",
    pattern: "gemini-2.0-flash*",
    label: "Gemini 2.0 Flash",
    inputPer1M: 0.1,
    cacheReadPer1M: 0.025,
    outputPer1M: 0.4,
    enabled: true
  },
  {
    id: "claude-sonnet-4",
    pattern: "claude-sonnet-4*",
    label: "Claude Sonnet 4",
    inputPer1M: 3.0,
    cacheReadPer1M: 0.3,
    outputPer1M: 15.0,
    enabled: true
  },
  {
    id: "claude-opus-4",
    pattern: "claude-opus-4*",
    label: "Claude Opus 4",
    inputPer1M: 15.0,
    cacheReadPer1M: 1.5,
    outputPer1M: 75.0,
    enabled: true
  }
];

function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .trim()
    .toLowerCase()
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}

export function matchPricingRule(
  model: string,
  rules: ModelPricingRule[]
): ModelPricingRule | null {
  const normalized = (model || "").trim().toLowerCase();
  if (!normalized || normalized === "auto" || normalized === "unknown") {
    return null;
  }

  // Exact match first, then longest specific pattern match.
  const enabled = rules.filter((r) => r.enabled && r.pattern.trim().length > 0);
  const exact = enabled.find(
    (r) => r.pattern.trim().toLowerCase() === normalized
  );
  if (exact) {
    return exact;
  }

  const sorted = [...enabled].sort(
    (a, b) => b.pattern.replace(/\*/g, "").length - a.pattern.replace(/\*/g, "").length
  );
  for (const rule of sorted) {
    if (globToRegex(rule.pattern).test(normalized)) {
      return rule;
    }
  }
  return null;
}

export interface StepCostEstimate {
  unpriced: boolean;
  inputUsd: number | null;
  cacheReadUsd: number | null;
  outputUsd: number | null;
  totalUsd: number | null;
  cacheSavingsUsd: number | null;
  matchedRule: ModelPricingRule | null;
}

export function estimateStepCost(
  tokens: {
    inputTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
  },
  model: string,
  rules: ModelPricingRule[]
): StepCostEstimate {
  const rule = matchPricingRule(model, rules);
  if (!rule) {
    return {
      unpriced: true,
      inputUsd: null,
      cacheReadUsd: null,
      outputUsd: null,
      totalUsd: null,
      cacheSavingsUsd: null,
      matchedRule: null
    };
  }

  const inputUsd = (tokens.inputTokens / 1_000_000) * rule.inputPer1M;
  const cacheReadUsd = (tokens.cacheReadTokens / 1_000_000) * rule.cacheReadPer1M;
  const outputUsd = (tokens.outputTokens / 1_000_000) * rule.outputPer1M;
  const totalUsd = inputUsd + cacheReadUsd + outputUsd;
  const cacheSavingsUsd =
    (tokens.cacheReadTokens / 1_000_000) *
    Math.max(0, rule.inputPer1M - rule.cacheReadPer1M);

  return {
    unpriced: false,
    inputUsd,
    cacheReadUsd,
    outputUsd,
    totalUsd,
    cacheSavingsUsd,
    matchedRule: rule
  };
}

export interface AggregateCostResult {
  estimatedCostUsd: number | null;
  cacheSavingsUsd: number | null;
  unpricedModels: string[];
}

export function aggregateCosts(
  steps: Array<{
    model: string;
    inputTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
  }>,
  rules: ModelPricingRule[]
): AggregateCostResult {
  let totalUsd = 0;
  let totalSavings = 0;
  let anyPriced = false;
  const unpricedSet = new Set<string>();

  for (const step of steps) {
    const est = estimateStepCost(step, step.model, rules);
    if (est.unpriced || est.totalUsd === null) {
      if (step.model && step.model.trim()) {
        unpricedSet.add(step.model.trim());
      } else {
        unpricedSet.add("unknown");
      }
    } else {
      anyPriced = true;
      totalUsd += est.totalUsd;
      totalSavings += est.cacheSavingsUsd ?? 0;
    }
  }

  return {
    estimatedCostUsd: anyPriced ? totalUsd : null,
    cacheSavingsUsd: anyPriced ? totalSavings : null,
    unpricedModels: Array.from(unpricedSet).sort()
  };
}
