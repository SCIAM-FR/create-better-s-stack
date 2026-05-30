import { describe, expect, it } from "bun:test";

import { buildPythonNextSteps } from "../src/helpers/core/post-installation";
import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// A well-formed `fastapi+streamlit` Project Configuration. This two-app shape is
// a uv *workspace*: a FastAPI API in apps/api and a Streamlit UI in apps/app,
// tied together by a root pyproject declaring `[tool.uv.workspace]`. The python
// discriminator is still `pythonApp` with `backend: "none"`.
function pythonWorkspace(overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-ws",
    ecosystem: "python",
    pythonApp: "fastapi+streamlit",
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

async function workspaceFiles(overrides: Overrides = {}) {
  const result = await pythonWorkspace(overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

describe("python fastapi+streamlit workspace generation", () => {
  it("generates successfully through the python seam", async () => {
    const result = await pythonWorkspace();
    expect(result.isOk()).toBe(true);
  });

  it('emits a root workspace pyproject declaring members = ["apps/*"]', async () => {
    const files = await workspaceFiles();
    const root = files.get("pyproject.toml") ?? "";
    expect(root).toContain("[tool.uv.workspace]");
    expect(root).toContain('members = ["apps/*"]');
  });

  it("emits both apps with their entrypoints under apps/", async () => {
    const files = await workspaceFiles();
    expect(files.get("apps/api/main.py") ?? "").toContain("from fastapi import FastAPI");
    expect(files.get("apps/app/app.py") ?? "").toContain("import streamlit as st");
  });

  it("gives each member its own pyproject with a distinct, installable name", async () => {
    const files = await workspaceFiles();
    const api = files.get("apps/api/pyproject.toml") ?? "";
    const app = files.get("apps/app/pyproject.toml") ?? "";
    expect(api).toContain('name = "py-ws-api"');
    expect(app).toContain('name = "py-ws-app"');
    // Members are packages so a single root `uv sync` can build + install them.
    expect(api).toContain("[build-system]");
    expect(app).toContain("[build-system]");
    expect(api).toContain('include = ["main.py"]');
    expect(app).toContain('include = ["app.py"]');
  });

  it("makes the root depend on both members via workspace sources", async () => {
    const files = await workspaceFiles();
    const root = files.get("pyproject.toml") ?? "";
    expect(root).toContain('"py-ws-api"');
    expect(root).toContain('"py-ws-app"');
    expect(root).toContain("[tool.uv.sources]");
    expect(root).toContain('"py-ws-api" = { workspace = true }');
    expect(root).toContain('"py-ws-app" = { workspace = true }');
  });

  it("aggregates capability-pack extras at the root project", async () => {
    const files = await workspaceFiles();
    const root = files.get("pyproject.toml") ?? "";
    expect(root).toContain("[project.optional-dependencies]");
  });

  it("emits a single root lock surface (no per-member lock) and no JS artifacts", async () => {
    const files = await workspaceFiles();
    const paths = [...files.keys()];
    expect(paths.filter((p) => p.endsWith("uv.lock"))).toHaveLength(0);
    expect(files.has("package.json")).toBe(false);
    expect(files.has("turbo.json")).toBe(false);
    expect(files.has("pnpm-workspace.yaml")).toBe(false);
  });
});

describe("python fastapi+streamlit workspace post-install commands", () => {
  it("emits a run step for both the API and the UI", () => {
    const steps = buildPythonNextSteps({
      // biome-ignore lint/suspicious/noExplicitAny: minimal config shim for a pure helper
      ...({ relativePath: "py-ws", pythonApp: "fastapi+streamlit", ecosystem: "python" } as any),
      depsInstalled: false,
    });
    expect(steps).toContain("cd py-ws");
    expect(steps).toContain("uv sync");
    expect(steps).toContain("uv run fastapi dev apps/api/main.py");
    expect(steps).toContain("uv run streamlit run apps/app/app.py");
  });
});
