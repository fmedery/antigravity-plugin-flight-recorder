import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { pathBaseName, sameLocalPath, unwrapFileUri } from "../shared/paths.js";
import type {
  DiagnosticFinding,
  ModelPricingRule,
  ModelUsageMetric,
  PluginSkillMetric
} from "../shared/types.js";
import {
  buildConversationDetail,
  buildDashboardData,
  buildProjectDetail
} from "./analytics.js";
import type { TrackerDatabase } from "./db.js";
import { runScan, type BrainRootConfig } from "./scanner.js";

export const APP_URI = "ui://flight-recorder/dashboard.html";

export interface TrackerServerContext {
  db: TrackerDatabase;
  dataDir: string;
  uiHtmlPath: string;
  brainRoots?: BrainRootConfig[];
  eventsPath?: string;
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtDur(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
}

function fmtTokenTotal(tokens: {
  inputTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  cacheHitRatio: number;
  hasTokenTelemetry: boolean;
}): string {
  if (!tokens.hasTokenTelemetry) return "N/A (legacy)";
  const total = tokens.inputTokens + tokens.cacheReadTokens + tokens.outputTokens;
  return `${fmtK(total)} tokens (${Math.round(tokens.cacheHitRatio * 100)}% cache)`;
}

function fmtCost(usd: number | null, unpriced: string[]): string {
  if (usd === null) {
    return unpriced.length > 0 ? `Unpriced (${unpriced.join(", ")})` : "Unpriced";
  }
  const base = `$${usd.toFixed(usd < 0.1 ? 4 : 2)} est.`;
  return unpriced.length > 0 ? `${base} (+ ${unpriced.length} unpriced model)` : base;
}

function fmtModelMix(breakdown: ModelUsageMetric[], maxItems = 4): string {
  if (breakdown.length === 0) return "unknown";
  const hasTokens = breakdown.some((m) => m.totalTokens > 0);
  const sorted = [...breakdown].sort((a, b) =>
    hasTokens ? b.tokenShare - a.tokenShare : b.stepShare - a.stepShare
  );
  const visible = sorted.slice(0, maxItems);
  const parts = visible.map((m) => {
    const share = hasTokens ? m.tokenShare : m.stepShare;
    return `${m.model} ${Math.round(share * 100)}%`;
  });
  const rest = sorted.length - visible.length;
  if (rest > 0) parts.push(`+${rest} more`);
  return `${parts.join(", ")}${hasTokens ? "" : " (by steps)"}`;
}

function fmtModelBreakdownLines(
  breakdown: ModelUsageMetric[],
  includeChats: boolean
): string[] {
  if (breakdown.length === 0) return ["  - unknown"];
  const hasAnyTokens = breakdown.some((m) => m.totalTokens > 0);
  return breakdown.map((m) => {
    const tokSegment =
      m.totalTokens > 0 || hasAnyTokens
        ? `${Math.round(m.tokenShare * 100)}% tokens (${fmtK(m.totalTokens)}, ${Math.round(m.cacheHitRatio * 100)}% cache)`
        : `0 tokens (legacy)`;
    const costSegment =
      m.estimatedCostUsd === null
        ? "Unpriced"
        : `$${m.estimatedCostUsd.toFixed(m.estimatedCostUsd < 0.1 ? 4 : 2)} est.`;
    const chatSegment = includeChats ? ` · ${m.chatCount} chats` : "";
    return `  - \`${m.model}\`: ${tokSegment} · ${Math.round(m.stepShare * 100)}% steps (${m.steps}) · ${Math.round(m.timeShare * 100)}% model time (${fmtDur(m.modelDurationMs)})${chatSegment} · ${costSegment}`;
  });
}

function fmtPluginSkillLines(
  metrics: PluginSkillMetric[],
  includeProjects: boolean
): string[] {
  return metrics.slice(0, 12).map((m) => {
    const scopePart =
      includeProjects && m.projectCount
        ? ` · ${m.projectCount} projects`
        : ` · ${m.chatCount} chats`;
    const spendPart =
      m.drivenCostUsd !== null
        ? `${m.costShare !== null ? `${Math.round(m.costShare * 100)}% spend ` : ""}($$${m.drivenCostUsd.toFixed(m.drivenCostUsd < 0.1 ? 4 : 2)} est.) · `.replace("$$", "$")
        : "";
    const timePart = `${Math.round(m.timeShare * 100)}% active time (${fmtDur(m.drivenActiveMs)})`;
    const childPart =
      m.children.length > 1 ? ` · ${m.children.length} sub-skills/tools` : ` · ${m.calls} calls`;
    const errPart = m.errors > 0 ? ` · ${m.errors} err` : "";
    const warnPart =
      m.warnings.length > 0 ? ` [${m.warnings.join(", ")}]` : "";
    return `  - [${m.kind}] **${m.name}**: ${spendPart}${timePart} · +${fmtK(m.totalTokens)} context (+${fmtK(m.instructionTokens)} instr / +${fmtK(m.executionTokens)} exec)${childPart}${scopePart}${errPart}${warnPart}`;
  });
}

function resolveProjectMatch(
  db: TrackerDatabase,
  projectPath?: string,
  projectName?: string
): string | null {
  const dash = buildDashboardData(db);
  if (dash.projects.length === 0) return null;

  if (projectPath) {
    const cleanInput = unwrapFileUri(projectPath);
    const exact = dash.projects.find((p) => sameLocalPath(p.projectPath, cleanInput));
    if (exact) return exact.projectPath;
    const byBasename = dash.projects.find(
      (p) => p.projectName.toLowerCase() === pathBaseName(cleanInput).toLowerCase()
    );
    if (byBasename) return byBasename.projectPath;
  }

  if (projectName) {
    const lower = projectName.toLowerCase();
    const match = dash.projects.find(
      (p) =>
        p.projectName.toLowerCase() === lower ||
        p.projectPath.toLowerCase().includes(lower)
    );
    if (match) return match.projectPath;
  }

  // Default to the most recently active assigned project, else first project.
  const nonUnassigned = dash.projects.find((p) => p.projectPath !== "Unassigned");
  return (nonUnassigned ?? dash.projects[0]).projectPath;
}

function readUiHtml(uiHtmlPath: string): string {
  const overridePath = process.env.FLIGHT_RECORDER_APP_HTML;
  const target =
    overridePath && overridePath.trim() ? overridePath.trim() : uiHtmlPath;
  if (fs.existsSync(target)) {
    const html = fs.readFileSync(target, "utf8");
    if (html.trim().length > 0) return html;
  }
  return `<!doctype html><html><body style="font-family:system-ui;padding:16px"><h3>Flight Recorder</h3><p>UI bundle not found at ${target}. Run <code>npm run build</code>.</p></body></html>`;
}

export function createTrackerMcpServer(ctx: TrackerServerContext): McpServer {
  const server = new McpServer({
    name: "flight-recorder",
    version: "0.2.0"
  });

  const scanNow = async () =>
    runScan({
      db: ctx.db,
      dataDir: ctx.dataDir,
      brainRoots: ctx.brainRoots,
      eventsPath: ctx.eventsPath
    });

  // Register MCP App HTML resource
  registerAppResource(
    server,
    "Flight Recorder Dashboard",
    APP_URI,
    {
      description:
        "Interactive dashboard for inspecting Antigravity project and chat tools, skills, token/cache attribution, estimated costs, and step timing.",
      _meta: {
        ui: {
          prefersBorder: false
        }
      }
    },
    async () => ({
      contents: [
        {
          uri: APP_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: readUiHtml(ctx.uiHtmlPath),
          _meta: {
            ui: {
              prefersBorder: false
            }
          }
        }
      ]
    })
  );

  // 1. Primary interactive UI tool (aux_pane + global sidebar entrypoints)
  registerAppTool(
    server,
    "open_flight_recorder",
    {
      title: "Flight Recorder",
      description:
        "Open the interactive Flight Recorder dashboard to inspect projects, chats, skills, tools, token/cache attribution, estimated USD costs, and timing waterfalls. All arguments are optional.",
      inputSchema: {
        projectPath: z
          .string()
          .optional()
          .describe("Optional absolute project workspace path to open directly."),
        conversationId: z
          .string()
          .optional()
          .describe("Optional conversation UUID to open directly on a specific chat."),
        view: z
          .enum(["projects", "project", "chat"])
          .optional()
          .describe("Initial view tab ('projects', 'project', or 'chat').")
      },
      _meta: {
        ui: {
          resourceUri: APP_URI
        },
        "com.google.antigravity/ui": {
          entrypoints: [
            { type: "aux_pane", title: "Flight Recorder" },
            { type: "global", title: "Flight Recorder" }
          ]
        }
      }
    },
    async ({ projectPath, conversationId, view }) => {
      await scanNow();
      const dashboard = buildDashboardData(ctx.db);

      const resolvedProject = projectPath
        ? resolveProjectMatch(ctx.db, projectPath)
        : null;
      const initialView =
        view ?? (conversationId ? "chat" : resolvedProject ? "project" : "projects");

      const slimProjects = dashboard.projects.slice(0, 40).map((p) => ({
        ...p,
        topSkills: p.topSkills.slice(0, 5),
        topTools: p.topTools.slice(0, 5)
      }));

      const structured = {
        initialView,
        selectedProjectPath: resolvedProject,
        selectedConversationId: conversationId ?? null,
        dashboard: {
          ...dashboard,
          projects: slimProjects,
          recentChats: dashboard.recentChats.slice(0, 20)
        }
      };

      const globalMix =
        dashboard.totals.modelBreakdown.length > 0
          ? `, model mix: ${fmtModelMix(dashboard.totals.modelBreakdown, 4)}`
          : "";
      const summaryText = `Flight Recorder loaded: ${dashboard.totals.projectCount} projects, ${dashboard.totals.chatCount} chats (+${dashboard.totals.subagentCount} subagents), ${fmtK(dashboard.totals.tokens.inputTokens + dashboard.totals.tokens.cacheReadTokens + dashboard.totals.tokens.outputTokens)} total tokens (${Math.round(dashboard.totals.tokens.cacheHitRatio * 100)}% cache hit), ${fmtDur(dashboard.totals.time.activeMs)} active agent time${globalMix}.`;

      return {
        content: [{ type: "text", text: summaryText }],
        structuredContent: structured
      };
    }
  );

  // 2. Model-callable: list_projects
  server.registerTool(
    "list_projects",
    {
      title: "List Tracked Projects",
      description:
        "List all Antigravity projects discovered from transcripts and live hooks with chat counts, per-model usage percentages, token usage, cache hit ratio, active time, and estimated USD cost.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional()
      }
    },
    async ({ limit }) => {
      await scanNow();
      const dash = buildDashboardData(ctx.db);
      const list = dash.projects.slice(0, limit ?? 30);

      const lines = list.map(
        (p) =>
          `- **${p.projectName}** (\`${p.projectPath}\`): ${p.chatCount} chats (+${p.subagentCount} subagents), ${fmtTokenTotal(p.tokens)}, ${fmtDur(p.time.activeMs)} active, ${fmtCost(p.tokens.estimatedCostUsd, p.tokens.unpricedModels)}, models: [${fmtModelMix(p.modelBreakdown, 3)}], plugins/skills: [${p.topPluginsSkills.join(", ") || "none"}]`
      );

      const pluginSection =
        dash.pluginSkillMetrics.length > 0
          ? `\n\nMost Token-Hungry Plugins & Skills (All Projects):\n${fmtPluginSkillLines(dash.pluginSkillMetrics, true).join("\n")}`
          : "";

      return {
        content: [
          {
            type: "text",
            text:
              list.length > 0
                ? `Tracked Projects (${dash.projects.length} total):\n${lines.join("\n")}${pluginSection}`
                : "No projects found in Antigravity transcripts yet."
          }
        ],
        structuredContent: {
          totals: dash.totals,
          projects: list,
          pluginSkillMetrics: dash.pluginSkillMetrics
        }
      };
    }
  );

  // 3. Model-callable: get_project_summary
  server.registerTool(
    "get_project_summary",
    {
      title: "Get Project Summary",
      description:
        "Get a full breakdown of what tasks, skills, tools, MCP servers, subagents, per-model usage breakdown, files, tokens, cache hits, estimated cost, and time built a project.",
      inputSchema: {
        projectPath: z.string().optional(),
        projectName: z.string().optional()
      }
    },
    async ({ projectPath, projectName }) => {
      await scanNow();
      const resolved = resolveProjectMatch(ctx.db, projectPath, projectName);
      if (!resolved) {
        return {
          content: [{ type: "text", text: "No tracked projects found." }]
        };
      }
      const detail = buildProjectDetail(ctx.db, resolved);
      if (!detail) {
        return {
          content: [
            { type: "text", text: `Project not found: ${projectPath ?? projectName}` }
          ]
        };
      }

      const s = detail.summary;
      const totalTok =
        s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens;
      const topMetrics = detail.skillToolMetrics.slice(0, 10).map(
        (m) =>
          `  - ${m.category} \`${m.name}\`: ${m.calls} calls, ${fmtDur(m.totalDurationMs)}, +${fmtK(m.directTokens)} direct / +${fmtK(m.compoundedCacheTokens)} cache carry`
      );
      const topChats = detail.chats.slice(0, 10).map(
        (c) =>
          `  - \`${c.conversationId}\` "${c.title}": ${c.tokens.hasTokenTelemetry ? `${fmtK(c.tokens.inputTokens + c.tokens.cacheReadTokens + c.tokens.outputTokens)} tok (${Math.round(c.tokens.cacheHitRatio * 100)}% cache)` : "N/A (legacy)"}, ${fmtDur(c.time.activeMs)} active`
      );

      const text = [
        `# Project: ${s.projectName} (\`${s.projectPath}\`)`,
        `- **Chats**: ${s.chatCount} top-level, ${s.subagentCount} subagents`,
        `- **Model Mix**: ${fmtModelMix(s.modelBreakdown, 6)}`,
        `- **Model Breakdown**:`,
        ...fmtModelBreakdownLines(s.modelBreakdown, true),
        `- **Tokens**: ${s.tokens.hasTokenTelemetry ? `${fmtK(totalTok)} total (${fmtK(s.tokens.inputTokens)} new input, ${fmtK(s.tokens.cacheReadTokens)} cache read [${Math.round(s.tokens.cacheHitRatio * 100)}% hit], ${fmtK(s.tokens.outputTokens)} output), peak context ${fmtK(s.tokens.peakContextTokens)}` : "N/A (legacy transcripts without token counters)"}`,
        `- **Estimated Cost**: ${fmtCost(s.tokens.estimatedCostUsd, s.tokens.unpricedModels)}`,
        `- **Time**: ${fmtDur(s.time.activeMs)} active (${fmtDur(s.time.modelMs)} model, ${fmtDur(s.time.toolWallMs)} tools @ ${s.time.parallelismFactor}x parallel, ${fmtDur(s.time.subagentMs)} subagents), ${fmtDur(s.time.userIdleMs)} user idle excluded`,
        ...(detail.pluginSkillMetrics.length > 0
          ? [
              `- **Most Token-Hungry Plugins & Skills**:`,
              ...fmtPluginSkillLines(detail.pluginSkillMetrics, false)
            ]
          : []),
        `- **MCP Servers**: ${s.mcpServers.join(", ") || "none"}`,
        `- **Top Tools & Skills**:`,
        ...topMetrics,
        `- **Recent Chats**:`,
        ...topChats
      ].join("\n");

      return {
        content: [{ type: "text", text }],
        structuredContent: {
          summary: detail.summary,
          chats: detail.chats.slice(0, 25),
          pluginSkillMetrics: detail.pluginSkillMetrics,
          skillToolMetrics: detail.skillToolMetrics.slice(0, 25),
          filesTouched: detail.filesTouched.slice(0, 30),
          diagnostics: detail.diagnostics
        }
      };
    }
  );

  // 4. Model-callable: get_chat_analysis
  server.registerTool(
    "get_chat_analysis",
    {
      title: "Get Chat Analysis",
      description:
        "Inspect a specific chat (by conversationId, or latest chat in projectPath) turn by turn and step by step: per-model breakdown, orchestrator model switches, tools, skills, token/cache growth, and active vs idle time.",
      inputSchema: {
        conversationId: z.string().optional(),
        projectPath: z.string().optional()
      }
    },
    async ({ conversationId, projectPath }) => {
      await scanNow();
      let targetId = conversationId;
      if (!targetId) {
        const dash = buildDashboardData(ctx.db);
        const candidates = projectPath
          ? dash.recentChats.filter((c) => sameLocalPath(c.projectPath, projectPath))
          : dash.recentChats;
        targetId = candidates[0]?.conversationId;
      }

      if (!targetId) {
        return {
          content: [{ type: "text", text: "No matching conversation found." }]
        };
      }

      const detail = buildConversationDetail(ctx.db, targetId);
      if (!detail) {
        return {
          content: [
            { type: "text", text: `Conversation not found: ${targetId}` }
          ]
        };
      }

      const s = detail.summary;
      const totalTok =
        s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens;
      const turnLines = detail.turns.map(
        (t) =>
          `  - Turn ${t.turnIndex + 1}${t.slashCommand ? ` (${t.slashCommand})` : ""}: "${t.promptPreview}" — ${fmtDur(t.activeMs)} active (${fmtDur(t.modelMs)} model, ${fmtDur(t.toolWallMs)} tools)${t.userIdleBeforeMs > 0 ? `, ${fmtDur(t.userIdleBeforeMs)} idle before` : ""}, ${s.tokens.hasTokenTelemetry ? `${fmtK(t.inputTokens)} new / ${fmtK(t.cacheReadTokens)} cache (${Math.round(t.cacheHitRatio * 100)}% hit)` : "N/A (legacy)"}`
      );
      const stepLines = detail.plannerSteps.slice(0, 30).map(
        (p) =>
          `  - Step ${p.stepIndex} (${p.model}): ${s.tokens.hasTokenTelemetry ? `${fmtK(p.inputTokens)} in, ${fmtK(p.cacheReadTokens)} cache (${Math.round(p.cacheHitRatio * 100)}%), ${fmtK(p.outputTokens)} out` : "N/A (legacy)"}, ${fmtDur(p.modelDurationMs)}${p.isCacheMiss ? ` [CACHE MISS: ${p.cacheMissCause}]` : ""} — ${p.attributedSummary}`
      );
      const switchLines = detail.modelSwitches.slice(0, 20).map(
        (sw) =>
          `  - Step ${sw.stepIndex} (Turn ${sw.turnIndex + 1}): \`${sw.fromModel}\` → \`${sw.toModel}\` — ${sw.trigger}${sw.isCacheMiss ? ` [CACHE MISS, +${fmtK(sw.inputTokensAfter)} uncached]` : ""}`
      );

      const textParts = [
        `# Chat: ${s.title} (\`${s.conversationId}\`)`,
        `- **Project**: ${s.projectName} (\`${s.projectPath}\`, source: ${s.projectSource})`,
        `- **Model Mix**: ${fmtModelMix(s.modelBreakdown, 6)}`,
        `- **Model Breakdown**:`,
        ...fmtModelBreakdownLines(s.modelBreakdown, false),
        ...(detail.pluginSkillMetrics.length > 0
          ? [
              `- **Most Token-Hungry Plugins & Skills**:`,
              ...fmtPluginSkillLines(detail.pluginSkillMetrics, false)
            ]
          : []),
        ...(detail.modelSwitches.length > 0
          ? [`- **Model Switches (${detail.modelSwitches.length})**:`, ...switchLines]
          : []),
        `- **Tokens**: ${s.tokens.hasTokenTelemetry ? `${fmtK(totalTok)} total, peak context ${fmtK(s.tokens.peakContextTokens)}, ${Math.round(s.tokens.cacheHitRatio * 100)}% cache hit` : "N/A (legacy transcript without token counters)"}`,
        `- **Estimated Cost**: ${fmtCost(s.tokens.estimatedCostUsd, s.tokens.unpricedModels)}`,
        `- **Time**: ${fmtDur(s.time.activeMs)} active (${fmtDur(s.time.modelMs)} model, ${fmtDur(s.time.toolWallMs)} tool wall @ ${s.time.parallelismFactor}x parallel, ${fmtDur(s.time.subagentMs)} subagents) · ${fmtDur(s.time.userIdleMs)} user idle`,
        `- **Turns (${detail.turns.length})**:`,
        ...turnLines,
        `- **Planner Steps (${detail.plannerSteps.length})**:`,
        ...stepLines
      ];

      return {
        content: [{ type: "text", text: textParts.join("\n") }],
        structuredContent: {
          summary: detail.summary,
          turns: detail.turns,
          plannerSteps: detail.plannerSteps.slice(0, 60),
          modelSwitches: detail.modelSwitches,
          pluginSkillMetrics: detail.pluginSkillMetrics,
          skillToolMetrics: detail.skillToolMetrics.slice(0, 30),
          diagnostics: detail.diagnostics,
          subagents: detail.subagents
        }
      };
    }
  );

  // 5. Model-callable: explain_bottlenecks
  server.registerTool(
    "explain_bottlenecks",
    {
      title: "Explain Token & Time Bottlenecks",
      description:
        "Explain why tokens spiked (direct + compounded cache carry + cache misses) and where time went across a chat or project, citing exact steps and tools.",
      inputSchema: {
        conversationId: z.string().optional(),
        projectPath: z.string().optional(),
        focus: z.enum(["all", "tokens", "time"]).optional()
      }
    },
    async ({ conversationId, projectPath, focus }) => {
      await scanNow();
      const mode = focus ?? "all";
      let diagnostics = [];
      let scopeLabel = "";

      if (conversationId) {
        const chat = buildConversationDetail(ctx.db, conversationId);
        if (!chat) {
          return {
            content: [{ type: "text", text: `Conversation not found: ${conversationId}` }]
          };
        }
        diagnostics = chat.diagnostics;
        scopeLabel = `Chat "${chat.summary.title}" (${conversationId})`;
      } else {
        const resolved = resolveProjectMatch(ctx.db, projectPath);
        if (!resolved) {
          return {
            content: [{ type: "text", text: "No tracked conversations or projects found." }]
          };
        }
        const proj = buildProjectDetail(ctx.db, resolved);
        if (!proj) {
          return {
            content: [{ type: "text", text: `Project not found: ${resolved}` }]
          };
        }
        diagnostics = proj.diagnostics;
        scopeLabel = `Project ${proj.summary.projectName}`;
      }

      const filtered = diagnostics.filter((d) => {
        if (mode === "tokens") {
          return (
            d.category === "token_driver" ||
            d.category === "cache_miss" ||
            d.category === "repeated_read" ||
            d.category === "model_split" ||
            d.category === "unused_skill" ||
            d.category === "high_skill_overhead" ||
            d.category === "tool_thrash" ||
            d.category === "subagent_candidate" ||
            d.category === "compaction_cliff"
          );
        }
        if (mode === "time") {
          return (
            d.category === "slow_step" ||
            d.category === "error_retry" ||
            d.category === "tool_thrash"
          );
        }
        return true;
      });

      const lines = filtered.map(
        (d, idx) =>
          `${idx + 1}. **[${d.severity.toUpperCase()}] ${d.title}** (${d.citation}) — ${d.detail}`
      );

      return {
        content: [
          {
            type: "text",
            text:
              lines.length > 0
                ? `# Bottleneck Diagnosis for ${scopeLabel}\n${lines.join("\n")}`
                : `No notable token or timing bottlenecks found for ${scopeLabel}.`
          }
        ],
        structuredContent: {
          scope: scopeLabel,
          focus: mode,
          findings: filtered
        }
      };
    }
  );

  // 5b. Model-callable: get_skill_optimization
  server.registerTool(
    "get_skill_optimization",
    {
      title: "Get Skill & Plugin Optimization Analysis",
      description:
        "Inspect parent plugins and skills (or drill down into a specific plugin/skill) across a chat, project, or all projects—showing share of total spend, share of active time, instruction markdown carry vs. tool execution tokens, child sub-skills/tools, file paths, and optimization prescriptions.",
      inputSchema: {
        pluginOrSkill: z
          .string()
          .optional()
          .describe("Optional parent plugin or skill name/id to filter and drill into."),
        projectPath: z
          .string()
          .optional()
          .describe("Optional project workspace path or name."),
        conversationId: z
          .string()
          .optional()
          .describe("Optional conversation UUID for single-chat (+ subagents) analysis.")
      }
    },
    async ({ pluginOrSkill, projectPath, conversationId }) => {
      await scanNow();

      let scopeLabel = "All Projects";
      let totalActiveMs = 0;
      let totalEstimatedCostUsd: number | null = null;
      let metrics: PluginSkillMetric[] = [];
      let diagnostics: DiagnosticFinding[] = [];

      if (conversationId) {
        const chat = buildConversationDetail(ctx.db, conversationId);
        if (!chat) {
          return {
            content: [{ type: "text", text: `Conversation not found: ${conversationId}` }]
          };
        }
        const subCostSum = chat.subagents.reduce(
          (acc, sub) => acc + (sub.tokens.estimatedCostUsd ?? 0),
          0
        );
        const anyCost =
          chat.summary.tokens.estimatedCostUsd !== null ||
          chat.subagents.some((s) => s.tokens.estimatedCostUsd !== null);
        scopeLabel = `Chat "${chat.summary.title}" (${conversationId})${chat.subagents.length > 0 ? ` + ${chat.subagents.length} subagent(s)` : ""}`;
        totalActiveMs = chat.scopeActiveMs ?? chat.summary.time.activeMs;
        totalEstimatedCostUsd = anyCost
          ? (chat.summary.tokens.estimatedCostUsd ?? 0) + subCostSum
          : null;
        metrics = chat.pluginSkillMetrics;
        diagnostics = chat.diagnostics;
      } else if (projectPath) {
        const resolved = resolveProjectMatch(ctx.db, projectPath);
        if (!resolved) {
          return {
            content: [{ type: "text", text: `Project not found: ${projectPath}` }]
          };
        }
        const proj = buildProjectDetail(ctx.db, resolved);
        if (!proj) {
          return {
            content: [{ type: "text", text: `Project not found: ${resolved}` }]
          };
        }
        scopeLabel = `Project ${proj.summary.projectName} (${proj.summary.projectPath})`;
        totalActiveMs = proj.summary.time.activeMs;
        totalEstimatedCostUsd = proj.summary.tokens.estimatedCostUsd;
        metrics = proj.pluginSkillMetrics;
        diagnostics = proj.diagnostics;
      } else {
        const dash = buildDashboardData(ctx.db);
        totalActiveMs = dash.totals.time.activeMs;
        totalEstimatedCostUsd = dash.totals.tokens.estimatedCostUsd;
        metrics = dash.pluginSkillMetrics;
      }

      const needle = (pluginOrSkill || "").trim().toLowerCase();
      const matched = needle
        ? metrics.filter(
            (m) =>
              m.name.toLowerCase().includes(needle) ||
              m.id.toLowerCase().includes(needle) ||
              m.children.some((ch) => ch.name.toLowerCase().includes(needle))
          )
        : metrics;

      const relatedDiagnostics = diagnostics.filter(
        (d) =>
          d.category === "unused_skill" ||
          d.category === "high_skill_overhead" ||
          d.category === "tool_thrash" ||
          d.category === "subagent_candidate" ||
          d.category === "compaction_cliff" ||
          (needle && d.title.toLowerCase().includes(needle))
      );

      if (matched.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: needle
                ? `No plugin or skill matching "${pluginOrSkill}" found in ${scopeLabel}.`
                : `No plugin or skill activity recorded in ${scopeLabel}.`
            }
          ],
          structuredContent: {
            scope: scopeLabel,
            totalActiveMs,
            totalEstimatedCostUsd,
            items: [],
            relatedDiagnostics
          }
        };
      }

      const blocks = matched.slice(0, 10).map((m, idx) => {
        const spendStr =
          m.drivenCostUsd !== null
            ? `${m.costShare !== null ? `${Math.round(m.costShare * 100)}% of spend ` : ""}($$${m.drivenCostUsd.toFixed(m.drivenCostUsd < 0.1 ? 4 : 2)} est.)`.replace("$$", "$")
            : "Unpriced";
        const childLines = m.children.slice(0, 12).map((ch) => {
          const chCost =
            ch.drivenCostUsd !== null
              ? ` · $$${ch.drivenCostUsd.toFixed(ch.drivenCostUsd < 0.1 ? 4 : 2)}`.replace("$$", "$")
              : "";
          const flags = [
            ch.errors > 0 ? `${ch.errors} err` : "",
            ch.isUnusedLoad ? "UNUSED LOAD" : "",
            ch.duplicateReads > 0 ? `${ch.duplicateReads}× dup read` : ""
          ]
            .filter(Boolean)
            .join(", ");
          return `    - [${ch.kind}] \`${ch.name}\`: ${fmtDur(ch.drivenActiveMs)}${chCost} · +${fmtK(ch.instructionTokens)} instr / +${fmtK(ch.executionTokens)} exec · ${ch.calls} calls${flags ? ` [${flags}]` : ""}`;
        });

        const errSamplesNote =
          m.errorSamples && m.errorSamples.length > 0
            ? m.errorSamples
                .slice(0, 3)
                .map(
                  (s) =>
                    `\`${s.toolName}\`${s.target ? ` (${s.target})` : ""}: ${s.message}${s.count > 1 ? ` (${s.count}×)` : ""}`
                )
                .join(" | ")
            : "Inspect child tools or chat waterfall for details.";

        return [
          `## ${idx + 1}. [${m.kind}] ${m.name}`,
          `- **Driven Spend**: ${spendStr}`,
          `- **Driven Active Time**: ${Math.round(m.timeShare * 100)}% of scope (${fmtDur(m.drivenActiveMs)}; raw tool calls: ${fmtDur(m.totalDurationMs)})`,
          `- **Context Footprint**: +${fmtK(m.totalTokens)} tokens (${Math.round(m.tokenShare * 100)}% of context reads — +${fmtK(m.instructionTokens)} instruction / +${fmtK(m.executionTokens)} execution)`,
          ...(m.targetPaths.length > 0
            ? [`- **Skill / Target Paths**: ${m.targetPaths.map((p) => `\`${p}\``).join(", ")}`]
            : []),
          ...(m.errors > 0 ? [`- **Errors (${m.errors})**: ${errSamplesNote}`] : []),
          ...(m.prescription ? [`- **Prescription**: ${m.prescription}`] : []),
          `- **Breakdown (${m.children.length})**:`,
          ...childLines
        ].join("\n");
      });

      return {
        content: [
          {
            type: "text",
            text: `# Skill & Plugin Optimization (${scopeLabel})\n\n${blocks.join("\n\n")}`
          }
        ],
        structuredContent: {
          scope: scopeLabel,
          totalActiveMs,
          totalEstimatedCostUsd,
          items: matched,
          relatedDiagnostics
        }
      };
    }
  );

  // 6. App-only: app_get_dashboard_data
  registerAppTool(
    server,
    "app_get_dashboard_data",
    {
      title: "Get Full Dashboard Data",
      description: "App-only endpoint returning all projects, recent chats, and pricing rules.",
      inputSchema: {},
      _meta: {
        ui: {
          visibility: ["app"]
        }
      }
    },
    async () => {
      await scanNow();
      const data = buildDashboardData(ctx.db);
      return {
        content: [{ type: "text", text: "ok" }],
        structuredContent: data as unknown as Record<string, unknown>
      };
    }
  );

  // 7. App-only: app_get_project_detail
  registerAppTool(
    server,
    "app_get_project_detail",
    {
      title: "Get Project Detail",
      description: "App-only endpoint returning complete detail for one project.",
      inputSchema: {
        projectPath: z.string()
      },
      _meta: {
        ui: {
          visibility: ["app"]
        }
      }
    },
    async ({ projectPath }) => {
      const detail = buildProjectDetail(ctx.db, projectPath);
      if (!detail) {
        return {
          isError: true,
          content: [{ type: "text", text: `Project not found: ${projectPath}` }]
        };
      }
      return {
        content: [{ type: "text", text: "ok" }],
        structuredContent: detail as unknown as Record<string, unknown>
      };
    }
  );

  // 8. App-only: app_get_chat_detail
  registerAppTool(
    server,
    "app_get_chat_detail",
    {
      title: "Get Chat Detail",
      description: "App-only endpoint returning full turns, steps, tool calls, and diagnostics for a chat.",
      inputSchema: {
        conversationId: z.string()
      },
      _meta: {
        ui: {
          visibility: ["app"]
        }
      }
    },
    async ({ conversationId }) => {
      const detail = buildConversationDetail(ctx.db, conversationId);
      if (!detail) {
        return {
          isError: true,
          content: [{ type: "text", text: `Conversation not found: ${conversationId}` }]
        };
      }
      return {
        content: [{ type: "text", text: "ok" }],
        structuredContent: detail as unknown as Record<string, unknown>
      };
    }
  );

  // 9. App-only: app_rescan_all
  registerAppTool(
    server,
    "app_rescan_all",
    {
      title: "Rescan Transcripts & Hooks",
      description: "App-only endpoint triggering an immediate incremental rescan.",
      inputSchema: {},
      _meta: {
        ui: {
          visibility: ["app"]
        }
      }
    },
    async () => {
      const stats = await scanNow();
      const dashboard = buildDashboardData(ctx.db);
      return {
        content: [{ type: "text", text: "ok" }],
        structuredContent: {
          stats,
          dashboard
        }
      };
    }
  );

  // 10. App-only: app_update_pricing
  registerAppTool(
    server,
    "app_update_pricing",
    {
      title: "Update Model Pricing Rules",
      description: "App-only endpoint saving updated USD pricing rules to SQLite.",
      inputSchema: {
        rules: z
          .array(
            z.object({
              id: z.string().min(1).max(160),
              pattern: z.string().min(1).max(160),
              label: z.string().min(1).max(160),
              inputPer1M: z.number().finite().min(0).max(100_000),
              cacheReadPer1M: z.number().finite().min(0).max(100_000),
              outputPer1M: z.number().finite().min(0).max(100_000),
              enabled: z.boolean()
            })
          )
          .max(100)
      },
      _meta: {
        ui: {
          visibility: ["app"]
        }
      }
    },
    async ({ rules }) => {
      ctx.db.savePricingRules(rules as ModelPricingRule[]);
      const dashboard = buildDashboardData(ctx.db);
      return {
        content: [{ type: "text", text: "ok" }],
        structuredContent: {
          dashboard
        }
      };
    }
  );

  // 11. App-only: app_assign_project
  registerAppTool(
    server,
    "app_assign_project",
    {
      title: "Assign Conversation to Project",
      description: "App-only endpoint overriding a conversation's assigned project path.",
      inputSchema: {
        conversationId: z.string().min(1).max(128),
        projectPath: z.string().max(1024)
      },
      _meta: {
        ui: {
          visibility: ["app"]
        }
      }
    },
    async ({ conversationId, projectPath }) => {
      ctx.db.setProjectOverride(conversationId, projectPath.trim() || "Unassigned");
      const dashboard = buildDashboardData(ctx.db);
      const chatDetail = buildConversationDetail(ctx.db, conversationId);
      return {
        content: [{ type: "text", text: "ok" }],
        structuredContent: {
          dashboard,
          chatDetail
        }
      };
    }
  );

  return server;
}
