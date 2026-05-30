# Slice 9 — Agents capability pack

Type: **AFK**

## What to build

Add the `pythonAgents` multi-select (`langgraph`/`openai-agents`/`claude-agent-sdk`/`pydantic-ai`/`llamaindex`/`crewai`/`autogen`) as additive dependency groups, reusing the pack machinery from Slice 7. When `pythonStarter` is on, emit an agent-loop starter for the selected agent framework. Composes freely with the light GenAI clients.

## Acceptance criteria

- [ ] `pythonAgents` picks emit correct `[project.optional-dependencies]` groups; `uv sync --extra` installs them
- [ ] `pythonStarter` opt-in emits an agent-loop starter per selected framework
- [ ] Representative combo (e.g. `langgraph` + `anthropic`) generates + `uv sync`; covered in **Default Suite**
- [ ] TS regression guards remain green; `bun run check` clean

## Blocked by

- Slice 7 — ML capability pack + accelerator wiring
