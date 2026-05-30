import { describe, expect, it } from "bun:test";

import { buildPythonNextSteps } from "../src/helpers/core/post-installation";
import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// A well-formed python fullstack Project Configuration. These shapes map onto
// the TS `self` (fullstack) concept: the UI *is* the server, so they generate a
// single flat-root runnable app with `backend: "none"` (the python discriminator
// is `pythonApp`, not `backend`).
function pythonFullstack(pythonApp: string, overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-ui",
    ecosystem: "python",
    // biome-ignore lint/suspicious/noExplicitAny: pythonApp is a string union
    pythonApp: pythonApp as any,
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

async function fullstackFiles(pythonApp: string, overrides: Overrides = {}) {
  const result = await pythonFullstack(pythonApp, overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

// The three python-native fullstack shapes share the flat-root, single-app
// contract; only the framework dependency, entrypoint import, and launch
// command differ. One vertical slice per shape, table-driven so a new shape is
// one row.
const SHAPES = [
  {
    pythonApp: "streamlit",
    dependency: "streamlit",
    appImport: "import streamlit as st",
    runHint: "uv run streamlit run app.py",
  },
  {
    pythonApp: "gradio",
    dependency: "gradio",
    appImport: "import gradio as gr",
    runHint: "uv run python app.py",
  },
  {
    pythonApp: "fasthtml",
    dependency: "python-fasthtml",
    appImport: "from fasthtml.common import",
    runHint: "uv run python app.py",
  },
] as const;

for (const shape of SHAPES) {
  describe(`python ${shape.pythonApp} generation`, () => {
    it("generates successfully through the python seam", async () => {
      const result = await pythonFullstack(shape.pythonApp);
      expect(result.isOk()).toBe(true);
    });

    it("emits an app.py entrypoint importing the framework", async () => {
      const files = await fullstackFiles(shape.pythonApp);
      const app = files.get("app.py") ?? "";
      expect(app).toContain(shape.appImport);
    });

    it("emits an application-style pyproject.toml depending on the framework", async () => {
      const files = await fullstackFiles(shape.pythonApp);
      const pyproject = files.get("pyproject.toml") ?? "";
      expect(pyproject).toContain("[project]");
      expect(pyproject).toContain('name = "py-ui"');
      expect(pyproject).toContain("requires-python");
      expect(pyproject).toContain(shape.dependency);
      // An application (not a distributable library): no wheel build backend, so
      // `uv sync` installs deps without trying to build the project itself.
      expect(pyproject).not.toContain("[build-system]");
    });

    it("puts the project root on the pytest path so tests can import app", async () => {
      const files = await fullstackFiles(shape.pythonApp);
      const pyproject = files.get("pyproject.toml") ?? "";
      expect(pyproject).toContain("[tool.pytest.ini_options]");
      expect(pyproject).toContain('pythonpath = ["."]');
    });

    it("emits a tests directory", async () => {
      const files = await fullstackFiles(shape.pythonApp);
      const hasTest = [...files.keys()].some((p) => p.startsWith("tests/") && p.endsWith(".py"));
      expect(hasTest).toBe(true);
    });

    it("emits a python .gitignore and no JS pipeline artifacts", async () => {
      const files = await fullstackFiles(shape.pythonApp);
      expect(files.has(".gitignore")).toBe(true);
      expect(files.has("package.json")).toBe(false);
      expect(files.has("turbo.json")).toBe(false);
      expect(files.has("pnpm-workspace.yaml")).toBe(false);
    });

    it("stays flat — no src package and no apps/ workspace layout", async () => {
      const files = await fullstackFiles(shape.pythonApp);
      const paths = [...files.keys()];
      expect(paths.some((p) => p.startsWith("src/"))).toBe(false);
      expect(paths.some((p) => p.startsWith("apps/"))).toBe(false);
    });
  });

  describe(`python ${shape.pythonApp} post-install commands`, () => {
    it("emits the framework's launch command in the next steps", () => {
      const steps = buildPythonNextSteps({
        // biome-ignore lint/suspicious/noExplicitAny: minimal config shim for a pure helper
        ...({ relativePath: "py-ui", pythonApp: shape.pythonApp, ecosystem: "python" } as any),
        depsInstalled: false,
      });
      expect(steps).toContain("cd py-ui");
      expect(steps).toContain("uv sync");
      expect(steps).toContain(shape.runHint);
    });
  });
}
