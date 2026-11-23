const MODEL_PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#6366f1",
  "#f97316",
  "#06b6d4",
  "#eab308"
] as const;

const UNKNOWN_COLOR = "#9ca3af";

/**
 * Deterministically maps a model identifier to a distinct, accessible chart color.
 */
export function getModelColor(model: string): string {
  const norm = (model || "").trim().toLowerCase();
  if (!norm || norm === "unknown") {
    return UNKNOWN_COLOR;
  }

  if (norm.includes("hydrogen-tiered-xhigh")) return "#14b8a6";
  if (norm.includes("hydrogen-tiered")) return "#10b981";
  if (norm.includes("hydrogen-xhigh")) return "#3b82f6";
  if (norm.includes("hydrogen")) return "#6366f1";
  if (norm.includes("neon-xhigh")) return "#8b5cf6";
  if (norm.includes("neon")) return "#ec4899";
  if (norm.includes("carbon")) return "#f59e0b";
  if (norm.includes("gemini-2.5-pro") || norm.includes("gemini-2.0-pro")) {
    return "#3b82f6";
  }
  if (norm.includes("flash")) return "#06b6d4";
  if (norm.includes("claude-opus")) return "#f97316";
  if (norm.includes("claude-sonnet")) return "#ec4899";

  let hash = 2166136261;
  for (let i = 0; i < norm.length; i++) {
    hash ^= norm.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const idx = (hash >>> 0) % MODEL_PALETTE.length;
  return MODEL_PALETTE[idx];
}

/**
 * Builds a collision-free color assignment map for a concrete set of models.
 */
export function buildModelColorMap(models: string[]): Map<string, string> {
  const map = new Map<string, string>();
  const usedColors = new Set<string>();

  for (const raw of models) {
    const key = (raw || "").trim() || "unknown";
    if (map.has(key)) continue;

    if (key.toLowerCase() === "unknown") {
      map.set(key, UNKNOWN_COLOR);
      continue;
    }

    let color = getModelColor(key);
    if (usedColors.has(color)) {
      const free = MODEL_PALETTE.find((c) => !usedColors.has(c));
      if (free) {
        color = free;
      }
    }
    usedColors.add(color);
    map.set(key, color);
  }

  return map;
}
