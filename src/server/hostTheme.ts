import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type ResolvedThemeMode = "dark" | "light";

interface ThemeSeeds {
  background: string;
  foreground: string;
  primary: string;
}

const BUILT_IN_THEMES: Record<ResolvedThemeMode, Record<string, ThemeSeeds>> = {
  light: {
    "Default Light": { background: "#F9F9F9", foreground: "#101010", primary: "#007acc" },
    "Legacy Light": { background: "#F9F9F9", foreground: "#101010", primary: "#007acc" },
    "Onyx Light": { background: "#FFFFFF", foreground: "#0A0A0C", primary: "#2F75C3" },
    Catppuccin: { background: "#EAECF0", foreground: "#4C4F69", primary: "#8839EF" },
    "Catppuccin Latte": { background: "#EFF1F5", foreground: "#4C4F69", primary: "#8839EF" },
    "Gruvbox Material": { background: "#f9f5d7", foreground: "#4f3829", primary: "#c35e0a" },
    "One Light": { background: "#F5F5F5", foreground: "#383A42", primary: "#4078F2" },
    "Solarized Light": { background: "#FAF4E5", foreground: "#435155", primary: "#CB4B16" }
  },
  dark: {
    "Default Dark": { background: "#101010", foreground: "#cccccc", primary: "#007acc" },
    "Legacy Dark": { background: "#101010", foreground: "#cccccc", primary: "#007acc" },
    "Onyx Dark": { background: "#070708", foreground: "#FFFFFF", primary: "#2F71E3" },
    Catppuccin: { background: "#24273A", foreground: "#CAD3F5", primary: "#C6A0F6" },
    "Catppuccin Macchiato": { background: "#24273A", foreground: "#CAD3F5", primary: "#C6A0F6" },
    "Catppuccin Mocha": { background: "#1E1E2E", foreground: "#CDD6F4", primary: "#CBA6F7" },
    Dracula: { background: "#282A36", foreground: "#F8F8F2", primary: "#BD93F9" },
    "Gruvbox Material": { background: "#141617", foreground: "#d4be98", primary: "#e78a4e" },
    Monokai: { background: "#272822", foreground: "#F8F8F2", primary: "#F92672" },
    Nord: { background: "#2E3440", foreground: "#D8DEE9", primary: "#88C0D0" },
    "One Dark Pro": { background: "#282C34", foreground: "#ABB2BF", primary: "#61AFEF" },
    "Tokyo Night": { background: "#1A1B26", foreground: "#A9B1D6", primary: "#7AA2F7" },
    "Solarized Dark": { background: "#002B36", foreground: "#93A1A1", primary: "#268BD2" },
    Vesper: { background: "#101010", foreground: "#FFFFFF", primary: "#FFC799" }
  }
};

export interface ResolvedHostTheme {
  mode: ResolvedThemeMode | "system";
  presetName: string | null;
  cssVariables: Record<string, string>;
  darkVariables: Record<string, string>;
  lightVariables: Record<string, string>;
}

export interface ResolveHostThemeOptions {
  configJsonPath?: string;
  appStoragePath?: string;
  platform?: NodeJS.Platform;
  homeDir?: string;
  env?: NodeJS.ProcessEnv;
}

export function defaultAppStoragePath(
  platform: NodeJS.Platform = process.platform,
  homeDir: string = os.homedir(),
  env: NodeJS.ProcessEnv = process.env
): string {
  if (platform === "darwin") {
    return path.join(
      homeDir,
      "Library",
      "Application Support",
      "Antigravity",
      "app_storage.json"
    );
  }
  if (platform === "win32") {
    const appData = env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    return path.join(appData, "Antigravity", "app_storage.json");
  }
  const xdg = env.XDG_CONFIG_HOME || path.join(homeDir, ".config");
  return path.join(xdg, "Antigravity", "app_storage.json");
}

function readJsonFileSafe(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore missing or malformed config files
  }
  return null;
}

function isSafeCssColor(val: unknown): val is string {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed.length > 64) return false;
  return /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch)\([0-9a-z.,%/\s+-]+\))$/i.test(
    trimmed
  );
}

function findPluginThemeSeeds(
  themes: unknown,
  mode: ResolvedThemeMode,
  presetName: string
): ThemeSeeds | null {
  if (!Array.isArray(themes) || !presetName) return null;
  const targetLower = presetName.toLowerCase();
  for (const item of themes) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const itemMode = obj.mode === "light" ? "light" : "dark";
    if (itemMode !== mode) continue;
    const label = String(obj.label || obj.id || "").trim().toLowerCase();
    if (label !== targetLower) continue;
    const seeds = obj.seeds as Record<string, unknown> | undefined;
    if (seeds && isSafeCssColor(seeds.background)) {
      const fg =
        (isSafeCssColor(seeds.foregroundOverride) && seeds.foregroundOverride) ||
        (isSafeCssColor(seeds.foreground) && seeds.foreground) ||
        (mode === "dark" ? "#F3F4F6" : "#111827");
      const pri =
        (isSafeCssColor(seeds.primary) && seeds.primary) ||
        (mode === "dark" ? "#60A5FA" : "#2563EB");
      return {
        background: seeds.background.trim(),
        foreground: fg.trim(),
        primary: pri.trim()
      };
    }
  }
  return null;
}

function lookupBuiltInSeeds(
  mode: ResolvedThemeMode,
  presetName: string
): ThemeSeeds | null {
  if (!presetName) return null;
  const table = BUILT_IN_THEMES[mode];
  if (table[presetName]) return table[presetName];
  const lower = presetName.toLowerCase();
  for (const [k, v] of Object.entries(table)) {
    if (k.toLowerCase() === lower) return v;
  }
  return null;
}

function parseHexLuminance(raw: string): number | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw.trim());
  if (!hex) return null;
  const h = hex[1];
  const r = h.length === 3 ? parseInt(h[0] + h[0], 16) : parseInt(h.slice(0, 2), 16);
  const g = h.length === 3 ? parseInt(h[1] + h[1], 16) : parseInt(h.slice(2, 4), 16);
  const b = h.length === 3 ? parseInt(h[2] + h[2], 16) : parseInt(h.slice(4, 6), 16);
  const lin = [r, g, b].map((v) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function buildCssVariablesFromSeeds(
  mode: ResolvedThemeMode,
  seeds: ThemeSeeds,
  highContrast: boolean
): Record<string, string> {
  const isDark = mode === "dark";
  const bg = seeds.background;
  const fg = seeds.foreground;
  const primary = seeds.primary;

  const cardPct = isDark ? (highContrast ? "7%" : "5%") : "0%";
  const tertiaryPct = isDark
    ? highContrast
      ? "14%"
      : "10%"
    : highContrast
      ? "8%"
      : "6%";
  const borderPrimaryPct = highContrast ? "24%" : "16%";
  const borderSecondaryPct = highContrast ? "14%" : "10%";

  const bgSecondary = isDark
    ? `color-mix(in oklab, ${fg} ${cardPct}, ${bg})`
    : `color-mix(in oklab, ${fg} 3%, ${bg})`;
  const bgTertiary = `color-mix(in oklab, ${fg} ${tertiaryPct}, ${bg})`;
  const txtSecondary = `color-mix(in oklab, ${fg} ${isDark ? "76%" : "72%"}, ${bg})`;
  const txtTertiary = `color-mix(in oklab, ${fg} ${isDark ? "56%" : "54%"}, ${bg})`;
  const bdrPrimary = `color-mix(in oklab, ${fg} ${borderPrimaryPct}, ${bg})`;
  const bdrSecondary = `color-mix(in oklab, ${fg} ${borderSecondaryPct}, ${bg})`;
  const primaryLum = parseHexLuminance(primary);
  const onPrimary =
    primaryLum !== null && primaryLum > 0.17913 ? "#111317" : "#ffffff";

  return {
    "--color-background-primary": bg,
    "--color-background-secondary": bgSecondary,
    "--color-background-tertiary": bgTertiary,
    "--color-text-primary": fg,
    "--color-text-secondary": txtSecondary,
    "--color-text-tertiary": txtTertiary,
    "--color-border-primary": bdrPrimary,
    "--color-border-secondary": bdrSecondary,
    "--color-ring-primary": primary,
    "--color-on-primary": onPrimary
  };
}

function resolvePaletteForMode(
  mode: ResolvedThemeMode,
  userSettings: Record<string, unknown>,
  storage: Record<string, unknown> | null,
  highContrast: boolean
): { presetName: string | null; cssVariables: Record<string, string> } {
  const storageKey =
    mode === "light" ? "theme-preset-light" : "theme-preset-dark";
  const storagePreset =
    typeof storage?.[storageKey] === "string"
      ? (storage[storageKey] as string).trim()
      : "";

  const rawPreset =
    (typeof userSettings.preset === "string" && userSettings.preset.trim()) ||
    (mode === "light"
      ? (typeof userSettings.themePresetLight === "string" &&
          userSettings.themePresetLight.trim()) ||
        (typeof userSettings["theme-preset-light"] === "string" &&
          userSettings["theme-preset-light"].trim()) ||
        storagePreset
      : (typeof userSettings.themePresetDark === "string" &&
          userSettings.themePresetDark.trim()) ||
        (typeof userSettings["theme-preset-dark"] === "string" &&
          userSettings["theme-preset-dark"].trim()) ||
        storagePreset) ||
    "";

  const presetName =
    rawPreset === "Default"
      ? mode === "light"
        ? "Default Light"
        : "Default Dark"
      : rawPreset === "Onyx" || rawPreset === "onyx"
        ? mode === "light"
          ? "Onyx Light"
          : "Onyx Dark"
        : rawPreset;

  const builtIn = lookupBuiltInSeeds(mode, presetName);
  const pluginSeeds =
    !builtIn && presetName
      ? findPluginThemeSeeds(userSettings.themes, mode, presetName)
      : null;

  const customSeedsObj = (
    mode === "light"
      ? userSettings.customThemeSeedsLight
      : userSettings.customThemeSeedsDark
  ) as Record<string, unknown> | undefined;

  let mergedSeeds: ThemeSeeds | null = builtIn
    ? { ...builtIn }
    : pluginSeeds
      ? { ...pluginSeeds }
      : null;

  if (customSeedsObj && typeof customSeedsObj === "object") {
    const cBg = isSafeCssColor(customSeedsObj.background)
      ? customSeedsObj.background.trim()
      : null;
    const cFg = isSafeCssColor(customSeedsObj.foregroundOverride)
      ? customSeedsObj.foregroundOverride.trim()
      : isSafeCssColor(customSeedsObj.foreground)
        ? customSeedsObj.foreground.trim()
        : null;
    const cPri = isSafeCssColor(customSeedsObj.primary)
      ? customSeedsObj.primary.trim()
      : null;

    if (cBg || cFg || cPri) {
      const fallbackSeeds =
        mergedSeeds ??
        BUILT_IN_THEMES[mode][mode === "light" ? "Onyx Light" : "Onyx Dark"];
      mergedSeeds = {
        background: cBg ?? fallbackSeeds.background,
        foreground: cFg ?? fallbackSeeds.foreground,
        primary: cPri ?? fallbackSeeds.primary
      };
    }
  }

  if (!mergedSeeds) {
    return { presetName: presetName || null, cssVariables: {} };
  }

  return {
    presetName: presetName || null,
    cssVariables: buildCssVariablesFromSeeds(mode, mergedSeeds, highContrast)
  };
}

/**
 * Resolves Antigravity's active theme mode and CSS tokens from ~/.gemini/config/config.json
 * and app_storage.json so the UI Sidecar matches Antigravity's active theme (Nord, Catppuccin,
 * Onyx, Tokyo Night, custom seeds, etc.) on first paint—even in system-auto dark/light mode.
 */
export function resolveHostTheme(
  options: ResolveHostThemeOptions = {}
): ResolvedHostTheme {
  const homeDir = options.homeDir ?? os.homedir();
  const configPath =
    options.configJsonPath ??
    path.join(homeDir, ".gemini", "config", "config.json");
  const storagePath =
    options.appStoragePath ??
    defaultAppStoragePath(options.platform, homeDir, options.env);

  const cfg = readJsonFileSafe(configPath);
  const storage = readJsonFileSafe(storagePath);

  const userSettings =
    cfg?.userSettings &&
    typeof cfg.userSettings === "object" &&
    !Array.isArray(cfg.userSettings)
      ? (cfg.userSettings as Record<string, unknown>)
      : cfg ?? {};

  const rawMode = userSettings.themeMode;
  let mode: ResolvedThemeMode | "system" = "system";
  if (
    rawMode === 1 ||
    rawMode === "1" ||
    rawMode === "THEME_MODE_LIGHT" ||
    rawMode === "light" ||
    rawMode === "hcLight"
  ) {
    mode = "light";
  } else if (
    rawMode === 2 ||
    rawMode === "2" ||
    rawMode === "THEME_MODE_DARK" ||
    rawMode === "dark" ||
    rawMode === "hcDark"
  ) {
    mode = "dark";
  }

  const rawContrast = userSettings.contrast ?? storage?.["jetski.contrast"];
  const highContrast =
    rawContrast === 2 ||
    rawContrast === "2" ||
    rawContrast === "CONTRAST_HIGH" ||
    rawMode === "hcDark" ||
    rawMode === "hcLight";

  const darkPalette = resolvePaletteForMode("dark", userSettings, storage, highContrast);
  const lightPalette = resolvePaletteForMode("light", userSettings, storage, highContrast);

  if (mode === "dark") {
    return {
      mode,
      presetName: darkPalette.presetName,
      cssVariables: darkPalette.cssVariables,
      darkVariables: darkPalette.cssVariables,
      lightVariables: lightPalette.cssVariables
    };
  }
  if (mode === "light") {
    return {
      mode,
      presetName: lightPalette.presetName,
      cssVariables: lightPalette.cssVariables,
      darkVariables: darkPalette.cssVariables,
      lightVariables: lightPalette.cssVariables
    };
  }

  return {
    mode: "system",
    presetName: darkPalette.presetName ?? lightPalette.presetName,
    cssVariables: {},
    darkVariables: darkPalette.cssVariables,
    lightVariables: lightPalette.cssVariables
  };
}
