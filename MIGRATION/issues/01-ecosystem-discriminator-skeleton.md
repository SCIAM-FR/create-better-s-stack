# Slice 1 — Ecosystem discriminator skeleton (no-op)

Type: **AFK**

## What to build

Introduce a single top-level `ecosystem` axis (default `"ts"`) to the **Project Configuration**, plus the parallel Python fields (`pythonApp`, `pythonOrm`, `pythonMl`, `pythonGenai`, `pythonAgents`, `accelerator`, `pythonStarter`) and the one extended enum (`packageManager` gains `"uv"`). Thread all of them through every surface that consumes the schema as **pure no-ops**: when `ecosystem === "ts"` (the default) nothing about the generated output changes.

This is the foundational tracer bullet. It deliberately cuts through all 13 canonical surfaces end-to-end but produces no Python project yet — the generator gets a single top-level `ecosystem === "python"` branch whose Python side is a stub. The slice is proven correct by a **reflective field-plumbing test** that mechanically asserts every `ProjectConfigSchema` field is wired through `DEFAULT_CONFIG`, the silent (`isSilent()`) config-construction path, `generateReproducibleCommand` output, and `BetterTStackConfigSchema` — converting the human checklist into a failing test.

Cross-field union semantics stay **imperative** (no cross-field Zod `superRefine`); the only structural refinement is the intra-array heavy-GenAI conflict on the GenAI list. This slice only lands the _fields and plumbing_, not the Python validation rules (those arrive with the first real Python shape).

Surfaces touched: schema + `*_VALUES` exports; `DEFAULT_CONFIG` + `PYTHON_TS_FIELD_DEFAULTS` projection; TS config types; both config-construction branches (silent + navigable group) + `PromptGroupResults` + return-mapping; `--ecosystem`/`--python-*` CLI flags; MCP input schema; regenerated JSON Schema; persisted `bts.jsonc` schema; reproducible-command; the single generator branch (Python stubbed); the three new prompt files (returning defaults, no UI) and the one-line `PYTHON_TS_FIELD_DEFAULTS` guard on each gated TS prompt.

## Acceptance criteria

- [ ] `ecosystem` defaults to `"ts"`; all parallel Python fields + `packageManager: "uv"` exist on the schema with `*_VALUES` exports
- [ ] Both config-construction paths (silent/flags and navigable group) resolve every new field; `PromptGroupResults` and the return-mapping include them
- [ ] `--ecosystem` and `--python-*` flags are accepted by the CLI and the MCP input schema; JSON Schema regenerated
- [ ] New fields persist into and round-trip from `bts.jsonc`; `generateReproducibleCommand` emits the corresponding flags
- [ ] `generate()` has exactly one top-level `ecosystem === "python"` branch (Python side stubbed); no per-step guards added to the 14 handlers / 8 processors
- [ ] Reflective field-plumbing test passes and fails loudly if any schema field is missing from any wired surface
- [ ] Regression: `create-matrix` and `silent-create-output` produce byte-identical output for `ecosystem: "ts"`; `bun run check` clean

## Blocked by

- None — can start immediately
