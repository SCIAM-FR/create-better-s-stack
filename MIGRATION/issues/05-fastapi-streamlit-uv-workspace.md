# Slice 5 — `fastapi+streamlit` uv workspace

Type: **AFK**

## What to build

Add the two-app shape: a FastAPI API plus a separate Streamlit UI, wired together as a **uv workspace** (not Turborepo/Nx). The router emits `apps/api` and `apps/app` from the existing `python/fastapi` and `python/streamlit` prefixes, plus a root `pyproject.toml` declaring `[tool.uv.workspace] members = ["apps/*"]` with a per-app `pyproject.toml` in each member. A single `uv.lock` lives at the root, and optional-dependency extras are declared at the root project so `uv sync --extra …` works from the root in v1.

## Acceptance criteria

- [ ] `pythonApp: "fastapi+streamlit"` generates `apps/api` + `apps/app` plus a root workspace `pyproject.toml` with `members = ["apps/*"]`
- [ ] Each member has its own `pyproject.toml`; extras aggregate at the root project
- [ ] `uv sync` at the root resolves a single root lock and installs both apps
- [ ] Workspace shape covered in the Python **Default Suite** coverage
- [ ] TS regression guards remain green; `bun run check` clean

## Blocked by

- Slice 3 — `fastapi` API service shape
- Slice 4 — Python-native fullstack frontends
