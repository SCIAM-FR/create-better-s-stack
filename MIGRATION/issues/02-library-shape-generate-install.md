# Slice 2 — First Python project: `library` shape generates + installs

Type: **AFK**

## What to build

Make the first real Python **Project Configuration** generatable and installable end-to-end. With `ecosystem: "python"`, `pythonApp: "library"`, `packageManager: "uv"`, the **Create Path** produces a flat package layout (`pyproject.toml`, `src/<pkg>/`, `tests/`) via **Virtual Generation**, **Filesystem Scaffolding** writes it to disk, and the install branch runs `uv sync` so the generated project installs cleanly.

This activates the Python side of the generator branch from Slice 1: a `processPythonTemplates` router (library prefix → flat root) plus `processPyproject` (dependency groups, `requires-python` floor) and `processPythonReadme`. It introduces `validatePythonConstraints` and the short-circuits of the TS none/convex/self cascades so a Python config carrying `backend: "none"` is not rejected by the TS rules. Post-install next-steps emit `uv run …` instead of `npm/pnpm/bun run`. New `.hbs` templates require regenerating the embedded-templates map.

## Acceptance criteria

- [ ] `validatePythonConstraints` enforces the v1 rules (api `none`, TS `orm` `none`, `packageManager` `uv`, `dbSetup` `none`, no mongodb) and is wired into both the flag/CLI and programmatic/MCP validation paths
- [ ] TS none/convex/self cascade validators short-circuit for `ecosystem === "python"`
- [ ] `processPythonTemplates` routes `library` to a flat root layout; `processPyproject` emits a valid `pyproject.toml`
- [ ] Embedded-templates map regenerated so the new `templates/python/**` files ship
- [ ] Install branch runs `uv sync` for Python configs; post-install next-steps use `uv run`
- [ ] A generated `library` project's `uv sync` succeeds; new Python shape covered in the **Default Suite** (separate from the TS exhaustive matrix)
- [ ] Regression guards from Slice 1 still green; `bun run check` clean

## Blocked by

- Slice 1 — Ecosystem discriminator skeleton
