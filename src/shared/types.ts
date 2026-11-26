export type SurfaceType = "antigravity" | "cli" | "ide" | "unknown";

export type SwarmRole = "coordinator" | "worker";

export interface ChildConversationLink {
  conversationId: string;
  role: string | null;
  typeName: string | null;
}

export type ProjectSource =
  | "manual"
  | "hook"
  | "parent"
  | "inferred"
  | "unassigned";

export type ToolCategory =
  | "skill"
  | "mcp"
  | "subagent"
  | "command"
  | "file_read"
  | "file_write"
  | "search"
  | "browser"
  | "other";

export type FileTouchAction = "read" | "edit" | "create";

export type DiagnosticSeverity = "info" | "warning" | "critical";

export type DiagnosticCategory =
  | "token_driver"
  | "cache_miss"
  | "slow_step"
  | "repeated_read"
  | "error_retry"
  | "model_split"
  | "unused_skill"
  | "high_skill_overhead"
  | "tool_thrash"
  | "subagent_candidate"
  | "compaction_cliff";

export interface ModelPricingRule {
  id: string;
  pattern: string;
  label: string;
  inputPer1M: number;
  cacheReadPer1M: number;
  outputPer1M: number;
  enabled: boolean;
  retired?: boolean;
}

export interface ModelAvailabilitySignal {
  model: string;
  lastSeenAtMs: number;
  lastUnavailableErrorAtMs: number | null;
  lastUnavailableReason: string | null;
}

export interface ModelAvailabilityStatus {
  status: "active" | "retired" | "unavailable" | "inactive";
  badge: string | null;
  reason: string | null;
}

export interface ModelUsageMetric {
  model: string;
  steps: number;
  stepShare: number;
  inputTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokenShare: number;
  cacheHitRatio: number;
  modelDurationMs: number;
  timeShare: number;
  estimatedCostUsd: number | null;
  chatCount: number;
}

export interface ModelSwitchEvent {
  stepIndex: number;
  turnIndex: number;
  fromModel: string;
  toModel: string;
  createdAtMs: number;
  isCacheMiss: boolean;
  inputTokensAfter: number;
  trigger: string;
}

export interface TokenSummary {
  inputTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  peakContextTokens: number;
  cacheHitRatio: number;
  hasTokenTelemetry: boolean;
  estimatedCostUsd: number | null;
  cacheSavingsUsd: number | null;
  unpricedModels: string[];
}

export interface TimeSummary {
  activeMs: number;
  modelMs: number;
  toolWallMs: number;
  toolSumMs: number;
  parallelismFactor: number;
  subagentMs: number;
  userIdleMs: number;
  wallClockMs: number;
}

export interface ToolCallRecord {
  id: number;
  stepIndex: number;
  plannerStepIndex: number;
  turnIndex: number;
  toolCallId: string | null;
  toolName: string;
  category: ToolCategory;
  mcpServer: string | null;
  skillName: string | null;
  skillPlugin: string | null;
  targetPath: string | null;
  childConversationId: string | null;
  childConversationIds?: string[];
  childLinks?: ChildConversationLink[];
  startedAtMs: number | null;
  completedAtMs: number | null;
  durationMs: number;
  argsPreview: string;
  resultBytes: number;
  estResultTokens: number;
  attributedInputTokens: number;
  compoundedCacheTokens: number;
  isError: boolean;
  errorPreview: string | null;
}

export interface PlannerStepRecord {
  stepIndex: number;
  turnIndex: number;
  model: string;
  createdAtMs: number;
  completedAtMs: number | null;
  modelDurationMs: number;
  inputTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  totalContextTokens: number;
  cacheHitRatio: number;
  isCacheMiss: boolean;
  cacheMissCause: string | null;
  thinkingChars: number;
  contentChars: number;
  toolCallCount: number;
  status: string;
  estimatedCostUsd: number | null;
  attributedSummary: string;
}

export interface TurnRecord {
  turnIndex: number;
  promptPreview: string;
  slashCommand: string | null;
  startedAtMs: number;
  endedAtMs: number;
  activeMs: number;
  modelMs: number;
  toolWallMs: number;
  userIdleBeforeMs: number;
  inputTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  cacheHitRatio: number;
}

export type PluginSkillChildKind = "SubSkill" | "MCP" | "CLI" | "Reference";

export interface ToolErrorSample {
  message: string;
  toolName: string;
  target: string | null;
  count: number;
  conversationId?: string;
  conversationTitle?: string;
  stepIndex?: number;
  childName?: string;
  childKind?: PluginSkillChildKind;
}

export interface SkillToolMetric {
  key: string;
  name: string;
  category: "Skill" | "Tool" | "MCP" | "Subagent";
  pluginOrServer: string | null;
  calls: number;
  errors: number;
  errorSamples?: ToolErrorSample[];
  totalDurationMs: number;
  resultBytes: number;
  directTokens: number;
  compoundedCacheTokens: number;
  estimatedCostUsd: number | null;
}

export interface PluginSkillChildMetric {
  key: string;
  name: string;
  kind: PluginSkillChildKind;
  calls: number;
  errors: number;
  errorSamples?: ToolErrorSample[];
  drivenActiveMs: number;
  drivenCostUsd: number | null;
  instructionTokens: number;
  executionTokens: number;
  totalTokens: number;
  duplicateReads: number;
  isUnusedLoad: boolean;
  targetPaths: string[];
}

export interface PluginSkillMetric {
  id: string;
  name: string;
  kind: "Plugin" | "Skill";
  calls: number;
  errors: number;
  errorSamples?: ToolErrorSample[];
  totalDurationMs: number;
  drivenActiveMs: number;
  timeShare: number;
  drivenCostUsd: number | null;
  costShare: number | null;
  instructionTokens: number;
  executionTokens: number;
  directTokens: number;
  compoundedCacheTokens: number;
  totalTokens: number;
  tokenShare: number;
  estimatedCostUsd: number | null;
  warningCount: number;
  warnings: string[];
  prescription: string | null;
  targetPaths: string[];
  children: PluginSkillChildMetric[];
  chatCount: number;
  projectCount?: number;
}

export interface FileTouchRecord {
  path: string;
  reads: number;
  edits: number;
  creates: number;
  totalBytesRead: number;
  directTokens: number;
  compoundedCacheTokens: number;
  lastTouchedAtMs: number;
}

export interface DiagnosticFinding {
  id: string;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  title: string;
  detail: string;
  stepIndex: number | null;
  turnIndex: number | null;
  impactTokens: number | null;
  impactMs: number | null;
  citation: string;
}

export interface ConversationSummary {
  conversationId: string;
  title: string;
  surface: SurfaceType;
  projectPath: string;
  projectName: string;
  projectSource: ProjectSource;
  parentConversationId: string | null;
  subagentRole: string | null;
  subagentType: string | null;
  swarmRole?: SwarmRole | null;
  swarmTitle?: string | null;
  startedAtMs: number;
  endedAtMs: number;
  terminationReason: string | null;
  models: string[];
  modelBreakdown: ModelUsageMetric[];
  slashCommands: string[];
  turnCount: number;
  stepCount: number;
  toolCallCount: number;
  errorCount: number;
  skillsUsed: string[];
  topPluginsSkills: string[];
  tokens: TokenSummary;
  time: TimeSummary;
  hasLiveHooks: boolean;
}

export interface ConversationDetail {
  summary: ConversationSummary;
  turns: TurnRecord[];
  plannerSteps: PlannerStepRecord[];
  modelSwitches: ModelSwitchEvent[];
  combinedModelBreakdown?: ModelUsageMetric[];
  subagentModelBreakdown?: ModelUsageMetric[];
  toolCalls: ToolCallRecord[];
  skillToolMetrics: SkillToolMetric[];
  pluginSkillMetrics: PluginSkillMetric[];
  filesTouched: FileTouchRecord[];
  diagnostics: DiagnosticFinding[];
  subagents: ConversationSummary[];
  scopeActiveMs?: number;
  swarmTasks?: Record<string, string>;
  combinedTokens?: TokenSummary;
}

export interface ContextHealthSummary {
  measuredChatCount: number;
  avgPeakContextTokens: number;
  maxPeakContextTokens: number;
  under200kCount: number;
  under200kRatio: number;
  cliff200kChats: number;
  compaction256kChats: number;
  compactionEventCount: number;
}

export interface PeriodComparison {
  label: string;
  priorSinceMs: number;
  priorUntilMs: number;
  hasPriorActivity: boolean;
  priorChatCount: number;
  priorSubagentCount: number;
  priorTotalTokens: number;
  priorCacheHitRatio: number;
  priorActiveMs: number;
  priorEstimatedCostUsd: number | null;
  priorAvgPeakContextTokens: number;
  priorMeasuredChatCount: number;
  chatsDeltaPct: number | null;
  tokensDeltaPct: number | null;
  cacheHitDeltaPp: number | null;
  activeMsDeltaPct: number | null;
  costDeltaPct: number | null;
  avgPeakContextDeltaPct: number | null;
}

export interface ProjectSummary {
  projectPath: string;
  projectName: string;
  chatCount: number;
  subagentCount: number;
  swarmCount?: number;
  firstActivityMs: number;
  lastActivityMs: number;
  models: string[];
  modelBreakdown: ModelUsageMetric[];
  topSkills: string[];
  topPluginsSkills: string[];
  topTools: string[];
  mcpServers: string[];
  slashCommands: string[];
  tokens: TokenSummary;
  time: TimeSummary;
  contextHealth: ContextHealthSummary;
  errorCount: number;
}

export type TimeRangePreset = "today" | "7d" | "30d" | "all";

export interface TimeRangeWindow {
  preset: TimeRangePreset;
  sinceMs: number | null;
  untilMs: number;
  firstActivityMs: number;
  lastActivityMs: number;
}

export interface ProjectDetail {
  summary: ProjectSummary;
  chats: ConversationSummary[];
  skillToolMetrics: SkillToolMetric[];
  pluginSkillMetrics: PluginSkillMetric[];
  filesTouched: FileTouchRecord[];
  diagnostics: DiagnosticFinding[];
  timeRange: TimeRangeWindow;
  periodComparison: PeriodComparison | null;
}

export interface DashboardData {
  generatedAtMs: number;
  timeRange: TimeRangeWindow;
  periodComparison: PeriodComparison | null;
  totals: {
    projectCount: number;
    chatCount: number;
    subagentCount: number;
    swarmCount?: number;
    tokens: TokenSummary;
    time: TimeSummary;
    contextHealth: ContextHealthSummary;
    errorCount: number;
    modelBreakdown: ModelUsageMetric[];
  };
  projects: ProjectSummary[];
  pluginSkillMetrics: PluginSkillMetric[];
  recentChats: ConversationSummary[];
  pricingRules: ModelPricingRule[];
  unpricedModels: string[];
  modelSignals?: Record<string, ModelAvailabilitySignal>;
  latestGlobalActivityMs?: number;
}

export type PluginInstallMethod = "git" | "marketplace" | "zip";

export interface UpdateCheckResult {
  status: "up_to_date" | "update_available" | "error";
  currentVersion: string;
  latestVersion: string | null;
  installMethod: PluginInstallMethod;
  pluginRoot: string | null;
  updateCommand: string | null;
  repoUrl: string;
  releaseUrl?: string;
  source?: "github_release" | "manifest";
  checkedAtMs: number;
  message?: string;
}
