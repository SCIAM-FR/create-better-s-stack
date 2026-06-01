# ws-verify

A [FastAPI](https://fastapi.tiangolo.com) + [Streamlit](https://streamlit.io) [uv workspace](https://docs.astral.sh/uv/concepts/projects/workspaces/) scaffolded with [Better-T-Stack](https://better-t-stack.dev).

Two apps, one shared environment and lockfile:

- `apps/api` — the FastAPI service
- `apps/app` — the Streamlit UI

## Getting started

Install everything from the workspace root with [uv](https://docs.astral.sh/uv/) — a single `uv sync` builds both members and resolves one root `uv.lock`:

```sh
uv sync
```

Run the API:

```sh
uv run fastapi dev apps/api/main.py
```

The API is then available at http://localhost:8000 (interactive docs at `/docs`).

In another terminal, run the UI:

```sh
uv run streamlit run apps/app/app.py
```

The UI is then available at http://localhost:8501.

## Tests

Run a member's tests from its directory:

```sh
uv run pytest apps/api
uv run pytest apps/app
```
