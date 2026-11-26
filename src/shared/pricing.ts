import type {
  ModelAvailabilitySignal,
  ModelAvailabilityStatus,
  ModelPricingRule
} from "./types.js";

export const MODEL_INACTIVE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

export const DEFAULT_RETIRED_MODEL_PATTERNS: readonly string[] = [
  "gemini-1.*",
  "gemini-2.0-*",
  "gemini-2.5-*",
  "gemini-3.*",
  "gemini-3-*",
  "gemini-4-argon*",
  "claude-3*",
  "claude-sonnet-4*",
  "claude-opus-4*"
];

export function isUnpriceablePlaceholderModel(model: string): boolean {
  const normalized = (model || "").trim().toLowerCase();
  return !normalized || normalized === "auto" || normalized === "unknown";
}

export interface DefaultPricingSourceInfo {
  shortLabel: string;
  provider: string;
  detail: string;
  url: string;
}

export const DEFAULT_PRICING_SOURCE_INFO: Readonly<
  Record<string, DefaultPricingSourceInfo>
> = {
  "gemini-2.5-pro": {
    shortLabel: "Gemini API",
    provider: "Google Gemini API",
    detail:
      "Built-in static reference rate from public Google Gemini API standard-tier (≤200k context) pricing. Not live-fetched and not Antigravity plan or credit billing.",
    url: "https://ai.google.dev/gemini-api/docs/pricing"
  },
  "gemini-2.5-flash": {
    shortLabel: "Gemini API",
    provider: "Google Gemini API",
    detail:
      "Built-in static reference rate from public Google Gemini API standard-tier pricing. Not live-fetched and not Antigravity plan or credit billing.",
    url: "https://ai.google.dev/gemini-api/docs/pricing"
  },
  "gemini-2.0-flash": {
    shortLabel: "Gemini API",
    provider: "Google Gemini API",
    detail:
      "Built-in static reference rate from public Google Gemini API standard-tier pricing. Not live-fetched and not Antigravity plan or credit billing.",
    url: "https://ai.google.dev/gemini-api/docs/pricing"
  },
  "claude-sonnet-4": {
    shortLabel: "Anthropic API",
    provider: "Anthropic API",
    detail:
      "Built-in static reference rate from public Anthropic API standard pricing. Not live-fetched and not Antigravity plan or credit billing.",
    url: "https://docs.anthropic.com/en/docs/about-claude/pricing"
  },
  "claude-opus-4": {
    shortLabel: "Anthropic API",
    provider: "Anthropic API",
    detail:
      "Built-in static reference rate from public Anthropic API standard pricing. Not live-fetched and not Antigravity plan or credit billing.",
    url: "https://docs.anthropic.com/en/docs/about-claude/pricing"
  }
};

export interface PricingRuleSourceBadge {
  kind: "builtin" | "edited_default" | "custom";
  label: string;
  detail: string;
}

export function describePricingRuleSource(
  rule: ModelPricingRule
): PricingRuleSourceBadge {
  const defaultRule = DEFAULT_PRICING_RULES.find((d) => d.id === rule.id);
  const sourceInfo = DEFAULT_PRICING_SOURCE_INFO[rule.id];
  if (defaultRule && sourceInfo) {
    const unchanged =
      rule.pattern.trim() === defaultRule.pattern &&
      rule.inputPer1M === defaultRule.inputPer1M &&
      rule.cacheReadPer1M === defaultRule.cacheReadPer1M &&
      rule.outputPer1M === defaultRule.outputPer1M;
    if (unchanged) {
      return {
        kind: "builtin",
        label: sourceInfo.shortLabel,
        detail: sourceInfo.detail
      };
    }
    return {
      kind: "edited_default",
      label: "Custom (edited)",
      detail: `User-edited override of built-in ${sourceInfo.provider} reference rule (stored locally in SQLite).`
    };
  }
  return {
    kind: "custom",
    label: "Custom",
    detail: "User-defined rate (stored locally in SQLite)."
  };
}

export const DEFAULT_PRICING_RULES: ModelPricingRule[] = [
  {
    id: "gemini-2.5-pro",
    pattern: "gemini-2.5-pro*",
    label: "Gemini 2.5 Pro",
    inputPer1M: 1.25,
    cacheReadPer1M: 0.3125,
    outputPer1M: 10.0,
    enabled: true,
    retired: true
  },
  {
    id: "gemini-2.5-flash",
    pattern: "gemini-2.5-flash*",
    label: "Gemini 2.5 Flash",
    inputPer1M: 0.15,
    cacheReadPer1M: 0.0375,
    outputPer1M: 0.6,
    enabled: true,
    retired: true
  },
  {
    id: "gemini-2.0-flash",
    pattern: "gemini-2.0-flash*",
    label: "Gemini 2.0 Flash",
    inputPer1M: 0.1,
    cacheReadPer1M: 0.025,
    outputPer1M: 0.4,
    enabled: true,
    retired: true
  },
  {
    id: "claude-sonnet-4",
    pattern: "claude-sonnet-4*",
    label: "Claude Sonnet 4",
    inputPer1M: 3.0,
    cacheReadPer1M: 0.3,
    outputPer1M: 15.0,
    enabled: true,
    retired: true
  },
  {
    id: "claude-opus-4",
    pattern: "claude-opus-4*",
    label: "Claude Opus 4",
    inputPer1M: 15.0,
    cacheReadPer1M: 1.5,
    outputPer1M: 75.0,
    enabled: true,
    retired: true
  }
];

function wildcardMatch(text: string, rawPattern: string): boolean {
  const pat = rawPattern
    .trim()
    .toLowerCase()
    .slice(0, 128)
    .replace(/\*+/g, "*");
  const str = text.slice(0, 256);

  let tIdx = 0;
  let pIdx = 0;
  let starIdx = -1;
  let matchIdx = 0;

  while (tIdx < str.length) {
    if (pIdx < pat.length && (pat[pIdx] === "?" || pat[pIdx] === str[tIdx])) {
      pIdx += 1;
      tIdx += 1;
    } else if (pIdx < pat.length && pat[pIdx] === "*") {
      starIdx = pIdx;
      matchIdx = tIdx;
      pIdx += 1;
    } else if (starIdx !== -1) {
      pIdx = starIdx + 1;
      matchIdx += 1;
      tIdx = matchIdx;
    } else {
      return false;
    }
  }

  while (pIdx < pat.length && pat[pIdx] === "*") {
    pIdx += 1;
  }
  return pIdx === pat.length;
}

export function matchesModelPattern(model: string, pattern: string): boolean {
  const cleanModel = (model || "").trim().toLowerCase();
  const cleanPat = (pattern || "").trim().toLowerCase();
  if (!cleanModel || !cleanPat) return false;
  return wildcardMatch(cleanModel, cleanPat);
}

function findBestRuleMatch(
  normalizedModel: string,
  candidates: ModelPricingRule[]
): ModelPricingRule | null {
  const nonEmpty = candidates.filter((r) => r.pattern.trim().length > 0);
  const exact = nonEmpty.find(
    (r) => r.pattern.trim().toLowerCase() === normalizedModel
  );
  if (exact) {
    return exact;
  }

  const sorted = [...nonEmpty].sort(
    (a, b) => b.pattern.replace(/\*/g, "").length - a.pattern.replace(/\*/g, "").length
  );
  for (const rule of sorted) {
    if (wildcardMatch(normalizedModel, rule.pattern)) {
      return rule;
    }
  }
  return null;
}

export function isDefaultRetiredModelPattern(modelOrPattern: string): boolean {
  const normalized = (modelOrPattern || "").trim().toLowerCase();
  if (isUnpriceablePlaceholderModel(normalized)) {
    return false;
  }
  return DEFAULT_RETIRED_MODEL_PATTERNS.some((pat) =>
    wildcardMatch(normalized, pat)
  );
}

export function getModelAvailability(
  model: string,
  rules: ModelPricingRule[] = [],
  signals?: Record<string, ModelAvailabilitySignal>,
  latestGlobalActivityMs = 0
): ModelAvailabilityStatus {
  if (isUnpriceablePlaceholderModel(model)) {
    return { status: "active", badge: null, reason: null };
  }
  const normalized = model.trim().toLowerCase();
  const matched = findBestRuleMatch(normalized, rules);
  if (matched?.retired === true) {
    return {
      status: "retired",
      badge: "Retired",
      reason: "Marked as retired / no longer available"
    };
  }
  if (matched?.retired === false) {
    return { status: "active", badge: null, reason: null };
  }

  if (isDefaultRetiredModelPattern(normalized)) {
    return {
      status: "retired",
      badge: "Retired",
      reason: "Legacy model family — no longer available"
    };
  }

  const sig = signals?.[normalized];
  if (
    sig &&
    sig.lastUnavailableErrorAtMs !== null &&
    sig.lastUnavailableErrorAtMs > sig.lastSeenAtMs
  ) {
    return {
      status: "unavailable",
      badge: "Unavailable",
      reason: `Auto-detected: server reported unavailable (${sig.lastUnavailableReason || "model error"})`
    };
  }

  if (
    latestGlobalActivityMs > 0 &&
    sig &&
    sig.lastSeenAtMs > 0 &&
    latestGlobalActivityMs - sig.lastSeenAtMs >= MODEL_INACTIVE_THRESHOLD_MS
  ) {
    const days = Math.floor(
      (latestGlobalActivityMs - sig.lastSeenAtMs) / (24 * 60 * 60 * 1000)
    );
    return {
      status: "inactive",
      badge: "Inactive",
      reason: `Not used for ${days}d before latest activity — may no longer be available`
    };
  }

  return { status: "active", badge: null, reason: null };
}

export function isModelRetired(
  model: string,
  rules: ModelPricingRule[] = [],
  signals?: Record<string, ModelAvailabilitySignal>,
  latestGlobalActivityMs = 0
): boolean {
  return (
    getModelAvailability(model, rules, signals, latestGlobalActivityMs).status !==
    "active"
  );
}

export function matchPricingRule(
  model: string,
  rules: ModelPricingRule[]
): ModelPricingRule | null {
  if (isUnpriceablePlaceholderModel(model)) {
    return null;
  }
  const normalized = model.trim().toLowerCase();
  const enabled = rules.filter((r) => r.enabled && r.pattern.trim().length > 0);
  return findBestRuleMatch(normalized, enabled);
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
      if (!isUnpriceablePlaceholderModel(step.model)) {
        unpricedSet.add(step.model.trim());
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
