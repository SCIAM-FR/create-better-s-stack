import { describe, expect, it } from "bun:test";

import { PythonGenaiListSchema } from "@better-t-stack/types";

import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// A python project carrying the GenAI capability pack (Slice 8). Light HTTP
// clients compose with anything; heavy self-host/train packs own the torch graph,
// imply a GPU, and pin mutually-exclusive versions.
function pythonGenai(overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-genai",
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

async function genaiFiles(overrides: Overrides = {}) {
  const result = await pythonGenai(overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

describe("python GenAI light clients", () => {
  it("adds a plain `llm` dependency group and composes with any shape", async () => {
    const files = await genaiFiles({ pythonApp: "library", pythonGenai: ["anthropic", "openai"] });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("llm = [");
    expect(pyproject).toContain("anthropic>=0.40");
    expect(pyproject).toContain("openai>=1.0");
    // Light clients are pure HTTP — no GPU wiring, no conflicts.
    expect(pyproject).not.toContain("[[tool.uv.index]]");
    expect(pyproject).not.toContain("conflicts");
  });
});

describe("python GenAI heavy packs", () => {
  it("emits a `serve` group + torch wiring + a tightened requires-python for vllm", async () => {
    const files = await genaiFiles({ pythonGenai: ["vllm"], accelerator: "cu124" });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("serve = [");
    expect(pyproject).toContain("vllm>=0.6");
    expect(pyproject).toContain("[[tool.uv.index]]");
    expect(pyproject).toContain('requires-python = ">=3.9,<3.13"');
  });

  it("declares a [tool.uv] conflict when both serve and train extras are present", async () => {
    const files = await genaiFiles({ pythonGenai: ["vllm", "peft"], accelerator: "cu124" });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("serve = [");
    expect(pyproject).toContain("train = [");
    expect(pyproject).toContain("[tool.uv]");
    expect(pyproject).toContain('[{ extra = "serve" }, { extra = "train" }]');
  });

  it("emits a vllm serving starter when pythonStarter is on", async () => {
    const files = await genaiFiles({
      pythonGenai: ["vllm"],
      accelerator: "cu124",
      pythonStarter: true,
    });
    expect(files.get("serve.py") ?? "").toContain("from vllm import");
  });
});

describe("python GenAI conflicts + constraints", () => {
  it("rejects two mutually-exclusive heavy packs at the array superRefine", () => {
    const result = PythonGenaiListSchema.safeParse(["vllm", "unsloth"]);
    expect(result.success).toBe(false);
  });

  it("allows a single heavy pack plus light clients at the array superRefine", () => {
    const result = PythonGenaiListSchema.safeParse(["vllm", "anthropic"]);
    expect(result.success).toBe(true);
  });

  it("rejects heavy GenAI on a cpu accelerator", async () => {
    const result = await pythonGenai({ pythonGenai: ["vllm"], accelerator: "cpu" });
    expect(result.isErr()).toBe(true);
  });

  it("rejects heavy GenAI targeting Cloudflare (no GPU)", async () => {
    const result = await pythonGenai({
      pythonGenai: ["vllm"],
      accelerator: "cu124",
      serverDeploy: "cloudflare",
    });
    expect(result.isErr()).toBe(true);
  });

  it("permits rocm as an experimental accelerator for heavy GenAI", async () => {
    const result = await pythonGenai({ pythonGenai: ["vllm"], accelerator: "rocm" });
    expect(result.isOk()).toBe(true);
  });
});
