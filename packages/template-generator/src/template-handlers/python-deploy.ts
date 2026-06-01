import type { ProjectConfig } from "@better-s-stack/types";

import type { VirtualFileSystem } from "../core/virtual-fs";
import { hasHeavyGenai } from "./python-deps";

/**
 * Python deploy story (Slice 10). The TS `processDeployTemplates` is
 * frontend-keyed and bypassed by the generator's python branch, so python gets
 * its own minimal Dockerfile: a CUDA base only when a GPU is actually needed
 * (a `cu*` accelerator AND a heavy GenAI pack), otherwise a slim python base.
 * Both install the project with uv. `webDeploy`/`serverDeploy` stay `none` for
 * Python v1 (managed-platform deploy deferred to v2).
 */

function usesCudaBase(config: Partial<ProjectConfig>): boolean {
  const accel = config.accelerator ?? "cpu";
  return accel.startsWith("cu") && hasHeavyGenai(config);
}

function cudaDockerfile(): string {
  return `# CUDA runtime base: a cu* accelerator with a heavy GenAI pack needs the GPU stack.
FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \\
    && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

# uv provides reproducible, fast installs.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app
COPY . .

# Install the project and its heavy GPU extras.
RUN uv sync --extra serve --extra train --no-dev || uv sync --no-dev

CMD ["uv", "run", "python", "-V"]
`;
}

function slimDockerfile(): string {
  return `# Slim python base: no GPU needed for this configuration.
FROM python:3.12-slim

# uv provides reproducible, fast installs.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app
COPY . .

RUN uv sync --no-dev

CMD ["uv", "run", "python", "-V"]
`;
}

export function processPythonDeploy(vfs: VirtualFileSystem, config: Partial<ProjectConfig>): void {
  if (config.ecosystem !== "python") return;
  // A library is a distributable package, not a deployable service — no Dockerfile.
  if (config.pythonApp === "library") return;
  vfs.writeFile("Dockerfile", usesCudaBase(config) ? cudaDockerfile() : slimDockerfile());
}
