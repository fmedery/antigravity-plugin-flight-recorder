# Flight Recorder (`flight-recorder`)

An Antigravity plugin for inspecting **what tasks, tools, skills, MCP servers, and subagents were used to create a project**—across an **entire project** or inside a **specific chat**—with clear root-cause attribution for **tokens**, **cache hits/misses**, **estimated USD costs**, and **step-by-step wall-clock time**.

## Features

- **All-Projects & Single-Chat Views**: Browse every workspace tracked by Antigravity App, CLI, and IDE, or drill into any specific conversation and its subagents.
- **Token & Cache Attribution**:
  - Exact `input_tokens`, `cache_read_tokens`, `output_tokens`, peak context, and cache hit %.
  - Proportional attribution of context growth to tool outputs and skill reads, plus **compounding cache carry cost** (`attributed_tokens × remaining_steps`).
  - Automatic **Cache Miss / Context Reset** detection (idle TTL expiry, model switches, compaction).
  - Editable per-model USD pricing table in the UI (**unknown models show as `Unpriced` until you configure a rate**).
- **Step-by-Step Timing Waterfall**:
  - Decomposes duration into **Model Thinking**, **Tool Execution** (with parallelism factor), **Subagent Execution**, and **User Wait/Idle** (excluded from active agent time).
- **Passive Zero-Friction Hooks**:
  - Uses only passive events (`SessionStart`, `PreInvocation`, `PostToolUse`, `PostInvocation`, `Stop`)—never `PreToolUse`—so permission prompts and tool execution are untouched.
- **Interactive MCP App UI + Chat Skill**:
  - Open **Flight Recorder** from the left sidebar (`global`) or any chat's side pane (`+` menu / `aux_pane`), or ask the agent questions in chat via the `flight-recorder` skill.

## Development & Installation

```bash
npm install
npm run build
npm test
npm run install-plugin
```

`npm run install-plugin` links this repository into `~/.gemini/config/plugins/flight-recorder`.
