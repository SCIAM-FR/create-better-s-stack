# Slice 7 — ML capability pack + accelerator wiring

Type: **AFK**

## What to build

Add the first capability pack and establish the shared pack machinery. The `pythonMl` multi-select (`scikit-learn`/`pytorch`/`tensorflow`/`jax`/`xgboost`/`lightgbm`) adds dependency groups to `pyproject.toml` under `[project.optional-dependencies]`, installed on demand via `uv sync --extra …`. For torch-based picks (`pytorch`), surface the `accelerator` question and emit PyTorch's per-accelerator wheel wiring: `[[tool.uv.index]]` + `explicit = true` + `[tool.uv.sources]` torch-with-`marker = "sys_platform == 'linux'"` for `cu121`/`cu124`/`rocm` (cpu = default PyPI, no explicit index). This is uv's canonical PyTorch pattern. When `pythonStarter` is on, emit the per-pack starter (e.g. `train.py`).

This slice also lands the shared `pythonStarter` boolean + the starter-emission step that Slices 8 and 9 reuse.

## Acceptance criteria

- [ ] `pythonMl` picks emit correct `[project.optional-dependencies]` groups; `uv sync --extra` installs them
- [ ] `accelerator` prompt appears only for torch-based picks; `tensorflow`/`jax` do not trigger it in v1
- [ ] `cpu` emits no explicit index; `cu*`/`rocm` emit the index/source/linux-marker block matching uv's pattern
- [ ] `requires-python` floor computed from the selected packs
- [ ] `pythonStarter` opt-in emits per-pack starters; off by default
- [ ] Accelerator wiring covered by a template snapshot/unit test (`cpu` vs `cu124`); pack combos representative, not exhaustive
- [ ] TS regression guards remain green; `bun run check` clean

## Blocked by

- Slice 2 — First Python project: `library` shape
