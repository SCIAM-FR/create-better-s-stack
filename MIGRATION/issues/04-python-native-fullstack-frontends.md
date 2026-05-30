# Slice 4 — Python-native fullstack frontends (`streamlit` / `gradio` / `fasthtml`)

Type: **AFK**

## What to build

Add the three Python-native fullstack shapes where the UI _is_ the server, mapping onto the existing **`self` (fullstack)** concept — one runnable process that is both UI and server. Each generates a single-app flat layout (templates routed to `.`) and suppresses the separate-backend question exactly as TS `self` does. Reuses the generator branch and validation from Slices 2–3; adds the `python/streamlit`, `python/gradio`, `python/fasthtml` template prefixes with their `app.py.hbs`.

## Acceptance criteria

- [ ] `pythonApp` ∈ {`streamlit`, `gradio`, `fasthtml`} each generate a single runnable app with a valid `pyproject.toml`
- [ ] The separate-backend prompt is suppressed for these shapes (no UI, `self`-style)
- [ ] `uv sync` succeeds and the app is launchable for each shape; shapes added to the Python coverage in the **Default Suite**
- [ ] TS regression guards remain green; `bun run check` clean

## Blocked by

- Slice 2 — First Python project: `library` shape
