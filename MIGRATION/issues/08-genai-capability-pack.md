# Slice 8 — GenAI capability pack (light + heavy + conflicts)

Type: **AFK**

## What to build

Add the `pythonGenai` multi-select, split into light HTTP clients (`openai`/`anthropic`/`google-genai`/`litellm` — compose with anything) and heavy self-host/train packs (`transformers`/`vllm`/`unsloth`/`trl`/`peft`/`accelerate` — own the torch graph, imply a GPU). Heavy picks pin conflicting torch/transformers versions, so block the mutually-exclusive ones at three layers: the array `superRefine` on the GenAI list, prompt-time grey-out of conflicting heavy picks, and `[tool.uv] conflicts` in the generated `pyproject.toml`. Extend `validatePythonConstraints`: heavy GenAI ⟹ `accelerator !== "cpu"` and ⟹ `serverDeploy !== "cloudflare"`. ROCm remains a permitted (experimental) accelerator. Heavy picks reuse the accelerator wiring and starter machinery from Slice 7 (e.g. vLLM serving entrypoint).

## Acceptance criteria

- [ ] Light clients add plain dependency groups and compose with any shape
- [ ] Heavy picks emit dependency groups + `[tool.uv] conflicts` for the mutually-exclusive set
- [ ] `vllm`+`unsloth` (etc.) rejected by the array `superRefine` and greyed out at prompt time
- [ ] heavy GenAI + `cpu` accelerator rejected; heavy GenAI + cloudflare rejected; mongodb still rejected
- [ ] Representative combos generate + `uv sync` (light client; one heavy serve path); covered in **Default Suite** and `cli-validation`
- [ ] TS regression guards remain green; `bun run check` clean

## Blocked by

- Slice 7 — ML capability pack + accelerator wiring
