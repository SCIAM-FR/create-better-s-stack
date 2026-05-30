# Slice 12 — Docs: polyglot capability

Type: **AFK**

## What to build

Document the new polyglot capability: the `ecosystem` discriminator, the Python app shapes (`library`/`fastapi`/`flask`/`django`/`streamlit`/`gradio`/`fasthtml`/`fastapi+streamlit`), `pythonOrm` + database reuse, the ML/GenAI/Agents capability packs, the `accelerator` option, and the uv-based install/deploy story. Note v1 limitations (SQL-only, Docker-only deploy, Linux-gated CUDA wheels).

## Acceptance criteria

- [ ] Docs describe the `ecosystem` choice and the Python app shapes
- [ ] Capability packs, `accelerator`, and uv install/`uv run` flow documented
- [ ] v1 limitations noted (no mongodb, dbSetup none, Docker-only deploy, Linux-only CUDA wheels)
- [ ] Reproducible-command examples include the `--ecosystem python --python-*` flags

## Blocked by

- Slice 2 — First Python project: `library` shape
