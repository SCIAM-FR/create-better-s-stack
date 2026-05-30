# Slice 3 — `fastapi` API service shape

Type: **AFK**

## What to build

Add the `fastapi` Python app shape: an API service with no UI, generated into an `apps/api/` layout (or flat when it is the sole app) with a runnable FastAPI entrypoint. Reuses the `processPythonTemplates` router, `processPyproject`, and `validatePythonConstraints` established in Slice 2; adds the `python/fastapi` template prefix and its `main.py.hbs`.

## Acceptance criteria

- [ ] `pythonApp: "fastapi"` routes templates to the `apps/api` destination via the router
- [ ] Generated app exposes a runnable FastAPI entrypoint and a valid `pyproject.toml`
- [ ] `uv sync` succeeds on the generated project; the FastAPI shape is added to the Python shape coverage in the **Default Suite**
- [ ] TS regression guards remain green; `bun run check` clean

## Blocked by

- Slice 2 — First Python project: `library` shape
