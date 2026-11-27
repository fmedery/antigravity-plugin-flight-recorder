import fs from "node:fs";
import { z } from "zod";
import type {
  ConversationDetail,
  DashboardData,
  ModelPricingRule,
  ProjectDetail,
  TimeRangePreset,
  UpdateCheckResult
} from "../shared/types.js";
import {
  buildConversationDetail,
  buildDashboardData,
  buildProjectDetail
} from "./analytics.js";
import type { TrackerDatabase } from "./db.js";
import { runScan, type BrainRootConfig, type ScanStats } from "./scanner.js";
import { checkForUpdate } from "./updateCheck.js";

export const SIDECAR_ID = "flight-recorder/dashboard";

export const timeRangeSchema = z.enum(["today", "7d", "30d", "all"]).optional();
export const sinceMsSchema = z.number().finite().positive().nullable().optional();

export const pricingRuleSchema = z.object({
  id: z.string().min(1).max(160),
  pattern: z.string().min(1).max(160),
  label: z.string().min(1).max(160),
  inputPer1M: z.number().finite().min(0).max(100_000),
  cacheReadPer1M: z.number().finite().min(0).max(100_000),
  outputPer1M: z.number().finite().min(0).max(100_000),
  enabled: z.boolean(),
  retired: z.boolean().optional()
});

export const dashboardQueryShape = {
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema,
  skipScan: z.boolean().optional()
};
export const DashboardQuerySchema = z.object(dashboardQueryShape);

export const projectDetailQueryShape = {
  projectPath: z.string().min(1).max(2048),
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema
};
export const ProjectDetailQuerySchema = z.object(projectDetailQueryShape);

export const chatDetailQueryShape = {
  conversationId: z.string().min(1).max(256)
};
export const ChatDetailQuerySchema = z.object(chatDetailQueryShape);

export const rescanQueryShape = {
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema,
  onlyIfChanged: z.boolean().optional()
};
export const RescanQuerySchema = z.object(rescanQueryShape);

export const updatePricingShape = {
  rules: z.array(pricingRuleSchema).max(100),
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema
};
export const UpdatePricingSchema = z.object(updatePricingShape);

export const assignProjectShape = {
  conversationId: z.string().min(1).max(128),
  projectPath: z.string().max(1024),
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema
};
export const AssignProjectSchema = z.object(assignProjectShape);

export interface TrackerServerContext {
  db: TrackerDatabase;
  dataDir: string;
  uiHtmlPath?: string;
  pluginRoot?: string;
  brainRoots?: BrainRootConfig[];
  eventsPath?: string;
}

export class AppServiceError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppServiceError";
    this.statusCode = statusCode;
  }
}

export function readUiHtml(uiHtmlPath: string): string {
  const overridePath = process.env.FLIGHT_RECORDER_APP_HTML;
  const target =
    overridePath && overridePath.trim() ? overridePath.trim() : uiHtmlPath;
  if (fs.existsSync(target)) {
    const html = fs.readFileSync(target, "utf8");
    if (html.trim().length > 0) return html;
  }
  return `<!doctype html><html><body style="font-family:system-ui;padding:16px"><h3>Flight Recorder</h3><p>UI bundle not found at ${target}. Run <code>npm run build</code>.</p></body></html>`;
}

export function buildSidecarDeepLink(params: {
  view?: "projects" | "project" | "chat";
  projectPath?: string | null;
  conversationId?: string | null;
  timeRange?: TimeRangePreset;
}): string {
  const qs = new URLSearchParams();
  if (params.view && params.view !== "projects") {
    qs.set("view", params.view);
  }
  if (params.projectPath) {
    qs.set("targetProjectPath", params.projectPath);
  }
  if (params.conversationId) {
    qs.set("targetConversationId", params.conversationId);
  }
  if (params.timeRange && params.timeRange !== "all") {
    qs.set("timeRange", params.timeRange);
  }
  const query = qs.toString();
  return query ? `sidecar://${SIDECAR_ID}/?${query}` : `sidecar://${SIDECAR_ID}/`;
}

export interface RescanResult {
  stats: ScanStats;
  changed: boolean;
  scannedAtMs: number;
  dashboard?: DashboardData;
}

export interface TrackerAppService {
  scanNow(): Promise<ScanStats>;
  getDashboardData(
    input?: z.infer<typeof DashboardQuerySchema>
  ): Promise<DashboardData>;
  getProjectDetail(
    input: z.infer<typeof ProjectDetailQuerySchema>
  ): Promise<ProjectDetail>;
  getChatDetail(
    input: z.infer<typeof ChatDetailQuerySchema>
  ): Promise<ConversationDetail>;
  rescanAll(input?: z.infer<typeof RescanQuerySchema>): Promise<RescanResult>;
  updatePricing(
    input: z.infer<typeof UpdatePricingSchema>
  ): Promise<{ dashboard: DashboardData }>;
  assignProject(
    input: z.infer<typeof AssignProjectSchema>
  ): Promise<{ dashboard: DashboardData; chatDetail: ConversationDetail | null }>;
  checkUpdate(): Promise<UpdateCheckResult>;
}

export function createTrackerAppService(
  ctx: TrackerServerContext
): TrackerAppService {
  const scanNow = async (): Promise<ScanStats> =>
    runScan({
      db: ctx.db,
      dataDir: ctx.dataDir,
      brainRoots: ctx.brainRoots,
      eventsPath: ctx.eventsPath
    });

  return {
    scanNow,

    async getDashboardData(input = {}) {
      if (!input.skipScan) {
        await scanNow();
      }
      return buildDashboardData(ctx.db, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      });
    },

    async getProjectDetail(input) {
      let detail = buildProjectDetail(ctx.db, input.projectPath, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      });
      if (!detail) {
        await scanNow();
        detail = buildProjectDetail(ctx.db, input.projectPath, {
          preset: input.timeRange,
          sinceMs: input.sinceMs
        });
      }
      if (!detail) {
        throw new AppServiceError(`Project not found: ${input.projectPath}`, 404);
      }
      return detail;
    },

    async getChatDetail(input) {
      let detail = buildConversationDetail(ctx.db, input.conversationId);
      if (!detail) {
        await scanNow();
        detail = buildConversationDetail(ctx.db, input.conversationId);
      }
      if (!detail) {
        throw new AppServiceError(
          `Conversation not found: ${input.conversationId}`,
          404
        );
      }
      return detail;
    },

    async rescanAll(input = {}) {
      const stats = await scanNow();
      const scannedAtMs = Date.now();
      const changed =
        stats.transcriptsIndexed > 0 || stats.hookEventsIngested > 0;
      if (input.onlyIfChanged && !changed) {
        return {
          stats,
          changed: false,
          scannedAtMs
        };
      }
      const dashboard = buildDashboardData(ctx.db, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      });
      return {
        stats,
        changed,
        scannedAtMs,
        dashboard
      };
    },

    async updatePricing(input) {
      ctx.db.savePricingRules(input.rules as ModelPricingRule[]);
      const dashboard = buildDashboardData(ctx.db, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      });
      return { dashboard };
    },

    async assignProject(input) {
      ctx.db.setProjectOverride(
        input.conversationId,
        input.projectPath.trim() || "Unassigned"
      );
      const dashboard = buildDashboardData(ctx.db, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      });
      const chatDetail = buildConversationDetail(ctx.db, input.conversationId);
      return {
        dashboard,
        chatDetail
      };
    },

    async checkUpdate() {
      return checkForUpdate({ pluginRoot: ctx.pluginRoot });
    }
  };
}
