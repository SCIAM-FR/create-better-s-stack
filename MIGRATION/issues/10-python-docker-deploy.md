# Slice 10 — Python Docker deploy

Type: **AFK**

## What to build

Give the Python path its own minimal deploy story, since the TS `processDeployTemplates` is frontend-keyed and bypassed by the generator branch. Add `processPythonDeploy` emitting a uv-based `Dockerfile`: an `nvidia/cuda:*` base when `accelerator` is `cu*` **and** heavy GenAI is present, otherwise `python:3.x-slim`, installing via `uv sync`. `webDeploy`/`serverDeploy` stay `none` for Python v1 (managed-platform deploy deferred to v2); heavy-GPU + Cloudflare is already rejected upstream.

## Acceptance criteria

- [ ] `processPythonDeploy` emits a `Dockerfile` for Python configs
- [ ] CUDA base selected only when `accelerator` is `cu*` and heavy GenAI present; slim base otherwise
- [ ] Generated `Dockerfile` installs the project via uv
- [ ] Dockerfile selection covered by a template snapshot/unit test
- [ ] TS regression guards remain green; `bun run check` clean

## Blocked by

- Slice 8 — GenAI capability pack
