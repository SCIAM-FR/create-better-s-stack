import { describe, expect, it } from "bun:test";

import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// Python deploy story (Slice 10): a uv-based Dockerfile with a CUDA base only
// when a GPU is genuinely needed.
function pythonDeploy(overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-deploy",
    ecosystem: "python",
    pythonApp: "fastapi",
    packageManager: "uv",
    backend: "none",
    api: "none",
    orm: "none",
    runtime: "none",
    frontend: [],
    auth: "none",
    payments: "none",
    database: "none",
    dbSetup: "none",
    webDeploy: "none",
    serverDeploy: "none",
    addons: [],
    examples: [],
    ...overrides,
  });
}

async function deployFiles(overrides: Overrides = {}) {
  const result = await pythonDeploy(overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

describe("python Docker deploy", () => {
  it("emits a uv-based Dockerfile for an app shape", async () => {
    const files = await deployFiles();
    const dockerfile = files.get("Dockerfile") ?? "";
    expect(dockerfile).toContain("uv sync");
    expect(dockerfile).toContain("astral-sh/uv");
  });

  it("uses a slim python base when no GPU is needed", async () => {
    const files = await deployFiles({ pythonMl: ["scikit-learn"] });
    const dockerfile = files.get("Dockerfile") ?? "";
    expect(dockerfile).toContain("python:3.12-slim");
    expect(dockerfile).not.toContain("nvidia/cuda");
  });

  it("uses a CUDA base only for a cu* accelerator with a heavy GenAI pack", async () => {
    const files = await deployFiles({ pythonGenai: ["vllm"], accelerator: "cu124" });
    const dockerfile = files.get("Dockerfile") ?? "";
    expect(dockerfile).toContain("nvidia/cuda");
  });

  it("does not use a CUDA base for a cu* accelerator without a heavy pack", async () => {
    const files = await deployFiles({ pythonMl: ["pytorch"], accelerator: "cu124" });
    const dockerfile = files.get("Dockerfile") ?? "";
    expect(dockerfile).toContain("python:3.12-slim");
    expect(dockerfile).not.toContain("nvidia/cuda");
  });

  it("emits no Dockerfile for a library (a package, not a deployable service)", async () => {
    const files = await deployFiles({ pythonApp: "library" });
    expect(files.has("Dockerfile")).toBe(false);
  });
});
