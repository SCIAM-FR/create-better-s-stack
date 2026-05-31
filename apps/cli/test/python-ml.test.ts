import { describe, expect, it } from "bun:test";

import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// A python project carrying the ML capability pack (Slice 7). Packs add
// `[project.optional-dependencies]` groups installed on demand via `uv sync --extra`.
function pythonMl(overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-ml",
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

async function mlFiles(overrides: Overrides = {}) {
  const result = await pythonMl(overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

describe("python ML capability pack", () => {
  it("emits an `ml` optional-dependency group for the selected picks", async () => {
    const files = await mlFiles({ pythonMl: ["scikit-learn", "xgboost"] });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("[project.optional-dependencies]");
    expect(pyproject).toContain("ml = [");
    expect(pyproject).toContain("scikit-learn>=1.5");
    expect(pyproject).toContain("xgboost>=2.1");
  });

  it("emits the per-accelerator torch wiring for pytorch + cu124", async () => {
    const files = await mlFiles({ pythonMl: ["pytorch"], accelerator: "cu124" });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("torch>=2.4");
    expect(pyproject).toContain("[[tool.uv.index]]");
    expect(pyproject).toContain('name = "pytorch-cu124"');
    expect(pyproject).toContain("https://download.pytorch.org/whl/cu124");
    expect(pyproject).toContain("explicit = true");
    expect(pyproject).toContain("[tool.uv.sources]");
    expect(pyproject).toContain(`marker = "sys_platform == 'linux'"`);
  });

  it("emits no explicit index for pytorch on cpu (default PyPI wheels)", async () => {
    const files = await mlFiles({ pythonMl: ["pytorch"], accelerator: "cpu" });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("torch>=2.4");
    expect(pyproject).not.toContain("[[tool.uv.index]]");
    expect(pyproject).not.toContain("pytorch-cu");
  });

  it("does not emit torch wiring for non-torch picks (scikit-learn)", async () => {
    const files = await mlFiles({ pythonMl: ["scikit-learn"], accelerator: "cu124" });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).not.toContain("[[tool.uv.index]]");
  });

  it("emits a per-pack starter only when pythonStarter is on", async () => {
    const off = await mlFiles({ pythonMl: ["pytorch"], accelerator: "cpu" });
    expect(off.has("train.py")).toBe(false);

    const on = await mlFiles({ pythonMl: ["pytorch"], accelerator: "cpu", pythonStarter: true });
    expect(on.has("train.py")).toBe(true);
  });
});
