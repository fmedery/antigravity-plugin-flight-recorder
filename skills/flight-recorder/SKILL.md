---
name: flight-recorder
description: Inspect and explain what tasks, tools, skills, plugins, MCP servers, models, and subagents built a project or ran in a chat, including most token-hungry plugins and standalone skills (rolled up without sub-skills or methods), per-model usage percentages, orchestrator model switches, why tokens and cache reads grew, estimated USD costs, and how wall-clock time was spent across steps. Use whenever the user asks about token usage, token-hungry plugins or skills, model mix or switches, cache hit ratio, cost, slow steps, project build history, or asks to open Flight Recorder.
license: MIT
compatibility: Requires Node.js >= 22.15.0 (built-in node:sqlite) and read access to local Antigravity transcripts.
---

# Flight Recorder Skill

Use the `flight-recorder_recorder` MCP tools to inspect real transcript and lifecycle-hook telemetry stored in SQLite—never guess token counts, model percentages, costs, or timing from memory.

## When to Open the Interactive Dashboard

Call `open_flight_recorder` when the user wants a visual overview, timeline waterfall, or interactive exploration of projects or chats:

- Call with `{}` to open the default view (all projects or most recent activity).
- Pass `projectPath` to open directly on a specific workspace project.
- Pass `conversationId` to open directly on a specific chat's waterfall, model mix, and token breakdown.

In the **Antigravity App** (both Consumer and Gemini Enterprise accounts), include the clickable `sidecar://` pill returned by `open_flight_recorder` in your reply (for example `[Flight Recorder](sidecar://flight-recorder/dashboard/)`) so Antigravity opens or toggles the interactive Sidecar dashboard in the side panel directly. Do **not** emit `sidecar://` links in Antigravity CLI (`agy`) or headless runs.

## Answering Specific Questions in Chat

1. **List tracked projects & global plugin/skill leaderboard**: Call `list_projects` to discover tracked workspaces, chat/Swarm counts, per-model usage percentages, total tokens, cache hit ratios, active time, estimated USD, and the global **Most Token-Hungry Plugins & Skills** ranking.
2. **Whole-project audit** ("What plugins/skills built this project?", "Which models or plugins used the most tokens?", "Was Swarm used?"): Call `get_project_summary` with `projectPath` (or `projectName`). Report the exact tasks/chats, Swarm run counts and worker rollups, per-model breakdown, rolled-up **Most Token-Hungry Plugins & Skills**, tools, subagent rollups, files touched, and top drivers.
3. **Single-chat breakdown** ("What happened in this chat?", "When did the orchestrator switch models?", "Break down turn by turn"): Call `get_chat_analysis` with `conversationId` (or `projectPath` to inspect its latest chat). If the chat ran in Swarm mode (`swarmRole`), explicitly note whether it was a Swarm coordinator or Swarm worker, report combined coordinator + worker totals and worker roster roles, and cite turn numbers, per-model breakdown, parent-first plugin/skill share of spend & active time, orchestrator model switch steps and triggers, exact `input_tokens`, `cache_read_tokens`, `output_tokens`, cache hit %, and active vs. idle time.
4. **Skill & plugin optimization drill-down** ("Which plugin caused 90% of my time and spend?", "Drill into Superpowers sub-skills", "How can I optimize our skills and tools?"): Call `get_skill_optimization` (optionally passing `pluginOrSkill`, `projectPath`, or `conversationId`). Always lead with the **parent plugin or top-level skill** share of spend and active time before breaking down its child sub-skills/tools, instruction markdown carry vs. execution output tokens, unused skill loads, duplicate `SKILL.md` reads, and prescriptions.
5. **Root-cause diagnosis** ("Why did this use so many tokens?", "Why was this slow?"): Call `explain_bottlenecks` with `projectPath` or `conversationId`. Present the ranked findings with step indices, direct vs. compounded cache carry tokens, `200k` / `256k` compaction cliffs, unused or high-overhead skills, tool retry thrash, subagent delegation candidates, cache-miss indicators, model-switch impact, and slowest model/tool durations.

## Grounding & Accuracy Rules

- **Report rolled-up plugin and standalone skill names**: When reporting the most token-hungry plugins or skills, roll plugin sub-skills (e.g., Superpowers skills), plugin CLIs, and plugin/MCP server methods up to the top-level plugin display name—never list internal sub-skill or method names.

- **Cite exact evidence**: Mention the step index, tool/skill name, byte size, and exact token/duration numbers returned by the tools.
- **Keep active time vs. idle time separate**: Clearly distinguish active agent execution (`model` + `tool wall` + `subagent`/`worker`) from user wait/idle gaps between turns and Swarm board parking (`swarm_wait`).
- **Be transparent about pricing**: If `unpricedModels` is non-empty or `estimatedCostUsd` is `null`, state which model(s) are `Unpriced` and tell the user they can set per-1M rates in Flight Recorder's **Pricing** modal—never invent a dollar figure for an unpriced model.
