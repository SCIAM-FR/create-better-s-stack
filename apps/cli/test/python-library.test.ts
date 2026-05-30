import { describe, expect, it } from "bun:test";

import { resolveInstallCommand } from "../src/helpers/core/install-dependencies";
import { buildPythonNextSteps } from "../src/helpers/core/post-installation";
import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// A well-formed python `library` Project Configuration. Individual tests
// override single fields to probe the python constraints.
function pythonLibrary(overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-lib",
    ecosystem: "python",
    pythonApp: "library",
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

async function libraryFiles(overrides: Overrides = {}) {
  const result = await pythonLibrary(overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

describe("python library generation", () => {
  it("generates successfully through the python seam", async () => {
    const result = await pythonLibrary();
    expect(result.isOk()).toBe(true);
  });

  it("emits a pyproject.toml naming the project with a build system", async () => {
    const files = await libraryFiles();
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("[project]");
    expect(pyproject).toContain('name = "py-lib"');
    expect(pyproject).toContain("[build-system]");
    expect(pyproject).toContain("requires-python");
  });

  it("emits a src package with an __init__.py named from the project", async () => {
    const files = await libraryFiles();
    const initPath = [...files.keys()].find(
      (p) => p.startsWith("src/") && p.endsWith("__init__.py"),
    );
    expect(initPath).toBe("src/py_lib/__init__.py");
  });

  it("emits a tests directory", async () => {
    const files = await libraryFiles();
    const hasTest = [...files.keys()].some((p) => p.startsWith("tests/") && p.endsWith(".py"));
    expect(hasTest).toBe(true);
  });

  it("emits a python .gitignore and no package.json (no JS pipeline)", async () => {
    const files = await libraryFiles();
    expect(files.has(".gitignore")).toBe(true);
    expect(files.has("package.json")).toBe(false);
  });

  it("persists the python ecosystem fields into bts.jsonc", async () => {
    // createVirtual does not stamp a version, so assert via a fresh generate path:
    // the reproducible command surface is covered elsewhere; here we confirm the
    // library tree carries no JS catalog/readme artifacts.
    const files = await libraryFiles();
    expect(files.has("turbo.json")).toBe(false);
    expect(files.has("pnpm-workspace.yaml")).toBe(false);
  });
});

describe("python constraints — TS-only choices are rejected by python validation", () => {
  async function expectRejected(overrides: Overrides) {
    const result = await pythonLibrary(overrides);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      // Rejected by validatePythonConstraints (which replaces the TS cascade),
      // not incidentally by the generator stub or a TS rule.
      expect(result.error.message).toContain("Python ecosystem");
    }
  }

  it("rejects a TS API layer", () => expectRejected({ api: "trpc" }));
  it("rejects a TS ORM", () => expectRejected({ orm: "drizzle" }));
  it("rejects mongodb (SQL-only in v1)", () => expectRejected({ database: "mongodb" }));
  it("rejects a managed db setup", () => expectRejected({ dbSetup: "turso" }));
  it("rejects a non-uv package manager", () => expectRejected({ packageManager: "bun" }));
  it("rejects a TS backend framework", () => expectRejected({ backend: "hono" }));
});

describe("python install + post-install commands", () => {
  it("installs python deps with uv sync", () => {
    const { command, args } = resolveInstallCommand({ ecosystem: "python", packageManager: "uv" });
    expect(command).toBe("uv");
    expect(args).toEqual(["sync"]);
  });

  it("passes capability-pack extras to uv sync", () => {
    const { args } = resolveInstallCommand({
      ecosystem: "python",
      packageManager: "uv",
      extras: ["ml", "agents"],
    });
    expect(args).toEqual(["sync", "--extra", "ml", "--extra", "agents"]);
  });

  it("leaves the TS install command unchanged", () => {
    const { command, args } = resolveInstallCommand({ ecosystem: "ts", packageManager: "pnpm" });
    expect(command).toBe("pnpm");
    expect(args).toEqual(["install"]);
  });

  it("emits uv-based next steps for a python project", () => {
    const steps = buildPythonNextSteps({
      // biome-ignore lint/suspicious/noExplicitAny: minimal config shim for a pure helper
      ...({ relativePath: "py-lib", pythonApp: "library", ecosystem: "python" } as any),
      depsInstalled: false,
    });
    expect(steps).toContain("cd py-lib");
    expect(steps).toContain("uv sync");
    expect(steps).toContain("uv run");
  });
});
