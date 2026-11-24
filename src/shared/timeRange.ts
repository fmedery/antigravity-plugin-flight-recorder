import type { TimeRangePreset } from "./types.js";

export interface TimeRangePresetOption {
  key: TimeRangePreset;
  label: string;
  longLabel: string;
}

export const TIME_RANGE_PRESETS: readonly TimeRangePresetOption[] = [
  { key: "today", label: "Today", longLabel: "Today" },
  { key: "7d", label: "7d", longLabel: "Last 7 days" },
  { key: "30d", label: "30d", longLabel: "Last 30 days" },
  { key: "all", label: "All time", longLabel: "All time" }
];

export interface TimeRangeQuery {
  preset?: TimeRangePreset;
  sinceMs?: number | null;
  untilMs?: number;
}

/**
 * Computes the local-calendar start timestamp (00:00:00.000) for a time-range
 * preset, returning `null` for `"all"`.
 */
export function computeLocalPresetSinceMs(
  preset: TimeRangePreset,
  nowMs = Date.now()
): number | null {
  if (preset === "all") return null;
  const d = new Date(nowMs);
  if (preset === "today") {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
  const daysBack = preset === "7d" ? 6 : 29;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysBack).getTime();
}

/**
 * Resolves inclusive time-range bounds, honoring explicit client `sinceMs` when
 * supplied so client local midnight applies cleanly.
 */
export function resolveTimeRangeBounds(
  query?: TimeRangeQuery,
  nowMs = Date.now()
): {
  preset: TimeRangePreset;
  sinceMs: number | null;
  untilMs: number;
} {
  const preset = query?.preset ?? "all";
  const untilMs =
    typeof query?.untilMs === "number" &&
    Number.isFinite(query.untilMs) &&
    query.untilMs > 0
      ? query.untilMs
      : nowMs;

  if (preset === "all") {
    return { preset: "all", sinceMs: null, untilMs };
  }

  const explicitSince = query?.sinceMs;
  const sinceMs =
    typeof explicitSince === "number" &&
    Number.isFinite(explicitSince) &&
    explicitSince > 0
      ? explicitSince
      : computeLocalPresetSinceMs(preset, untilMs);

  return { preset, sinceMs, untilMs };
}

/**
 * Builds MCP tool arguments for a user-selected preset using the browser's
 * local calendar boundaries.
 */
export function buildClientTimeRangeArgs(
  preset: TimeRangePreset,
  nowMs = Date.now()
): { timeRange: TimeRangePreset; sinceMs?: number } {
  const sinceMs = computeLocalPresetSinceMs(preset, nowMs);
  return sinceMs !== null ? { timeRange: preset, sinceMs } : { timeRange: preset };
}
