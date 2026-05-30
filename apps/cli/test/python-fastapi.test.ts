import { describe, expect, it } from "bun:test";

import { buildPythonNextSteps } from "../src/helpers/core/post-installation";
import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// A well-formed python `fastapi` Project Configuration. A sole fastapi app is a
// flat-root project (plan §261) — pyproject + main.py + tests at the root, just
// like `library`. The `apps/api` workspace layout is deferred to Slice 5.
function pythonFastapi(overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-api",
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

async function fastapiFiles(overrides: Overrides = {}) {
  const result = await pythonFastapi(overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

describe("python fastapi generation", () => {
  it("generates successfully through the python seam", async () => {
    const result = await pythonFastapi();
    expect(result.isOk()).toBe(true);
  });

  it("emits a runnable FastAPI entrypoint at main.py", async () => {
    const files = await fastapiFiles();
    const main = files.get("main.py") ?? "";
    expect(main).toContain("from fastapi import FastAPI");
    expect(main).toContain("app = FastAPI(");
  });

  it("emits an application-style pyproject.toml depending on fastapi", async () => {
    const files = await fastapiFiles();
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("[project]");
    expect(pyproject).toContain('name = "py-api"');
    expect(pyproject).toContain("requires-python");
    expect(pyproject).toContain('"fastapi[standard]');
    // An application (not a distributable library): no wheel build backend, so
    // `uv sync` installs deps without trying to build the project itself.
    expect(pyproject).not.toContain("[build-system]");
  });

  it("puts the project root on the pytest path so tests can import main", async () => {
    const files = await fastapiFiles();
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("[tool.pytest.ini_options]");
    expect(pyproject).toContain('pythonpath = ["."]');
  });

  it("emits a tests directory that exercises the app via TestClient", async () => {
    const files = await fastapiFiles();
    const testPath = [...files.keys()].find((p) => p.startsWith("tests/") && p.endsWith(".py"));
    expect(testPath).toBeDefined();
    const content = files.get(testPath ?? "") ?? "";
    expect(content).toContain("from fastapi.testclient import TestClient");
    expect(content).toContain("from main import app");
  });

  it("emits a python .gitignore and no JS pipeline artifacts", async () => {
    const files = await fastapiFiles();
    expect(files.has(".gitignore")).toBe(true);
    expect(files.has("package.json")).toBe(false);
    expect(files.has("turbo.json")).toBe(false);
    expect(files.has("pnpm-workspace.yaml")).toBe(false);
  });

  it("stays flat — no src package and no apps/ workspace layout", async () => {
    const files = await fastapiFiles();
    const paths = [...files.keys()];
    expect(paths.some((p) => p.startsWith("src/"))).toBe(false);
    expect(paths.some((p) => p.startsWith("apps/"))).toBe(false);
  });
});

describe("python fastapi post-install commands", () => {
  it("emits a `fastapi dev` run hint in the next steps", () => {
    const steps = buildPythonNextSteps({
      // biome-ignore lint/suspicious/noExplicitAny: minimal config shim for a pure helper
      ...({ relativePath: "py-api", pythonApp: "fastapi", ecosystem: "python" } as any),
      depsInstalled: false,
    });
    expect(steps).toContain("cd py-api");
    expect(steps).toContain("uv sync");
    expect(steps).toContain("uv run fastapi dev main.py");
  });
});
