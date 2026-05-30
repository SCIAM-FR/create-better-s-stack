import path from "node:path";
import { fileURLToPath } from "node:url";

import { desktopWebFrontends } from "@better-t-stack/types";
import type { Addons, Examples, Frontend } from "@better-t-stack/types";

import { getUserPkgManager } from "./utils/get-package-manager";

// Re-export from template-generator (single source of truth)
export {
  dependencyVersionMap,
  type AvailableDependencies,
} from "@better-t-stack/template-generator";

const __filename = fileURLToPath(import.meta.url);
const distPath = path.dirname(__filename);
export const PKG_ROOT = path.join(distPath, "../");

export const DEFAULT_CONFIG_BASE = {
  projectName: "my-better-t-app",
  relativePath: "my-better-t-app",
  ecosystem: "ts",
  frontend: ["tanstack-router"],
  database: "sqlite",
  orm: "drizzle",
  auth: "better-auth",
  payments: "none",
  addons: ["turborepo"],
  examples: [],
  git: true,
  install: true,
  dbSetup: "none",
  backend: "hono",
  runtime: "bun",
  api: "trpc",
  webDeploy: "none",
  serverDeploy: "none",
  // Python ecosystem fields — inert under the default `ts` ecosystem
  pythonApp: "none",
  pythonOrm: "none",
  pythonMl: [],
  pythonGenai: [],
  pythonAgents: [],
  accelerator: "cpu",
  pythonStarter: false,
} as const;

export function getDefaultConfig() {
  return {
    ...DEFAULT_CONFIG_BASE,
    projectDir: path.resolve(process.cwd(), DEFAULT_CONFIG_BASE.projectName),
    packageManager: getUserPkgManager(),
    frontend: [...DEFAULT_CONFIG_BASE.frontend],
    addons: [...DEFAULT_CONFIG_BASE.addons],
    examples: [...DEFAULT_CONFIG_BASE.examples],
    pythonMl: [...DEFAULT_CONFIG_BASE.pythonMl],
    pythonGenai: [...DEFAULT_CONFIG_BASE.pythonGenai],
    pythonAgents: [...DEFAULT_CONFIG_BASE.pythonAgents],
  };
}

export const DEFAULT_CONFIG = getDefaultConfig();

/**
 * The single shared projection of TS-only stack fields to their inert values
 * when `ecosystem === "python"`. Reused by both the silent config path and the
 * gated TS prompts so the two can't drift (plan §3.3 / Decision 5).
 * `database` is intentionally absent — a Python project may carry a real one.
 */
export const PYTHON_TS_FIELD_DEFAULTS = {
  frontend: [] as Frontend[],
  backend: "none",
  api: "none",
  orm: "none",
  auth: "none",
  payments: "none",
  runtime: "none",
  packageManager: "uv",
  addons: [] as Addons[],
  examples: [] as Examples[],
  dbSetup: "none",
  webDeploy: "none",
  serverDeploy: "none",
} as const;

export { desktopWebFrontends };

export const ADDON_COMPATIBILITY = {
  pwa: ["tanstack-router", "react-router", "solid", "next"],
  tauri: desktopWebFrontends,
  electrobun: desktopWebFrontends,
  biome: [],
  husky: [],
  lefthook: [],
  turborepo: [],
  nx: [],
  starlight: [],
  ultracite: [],
  mcp: [],
  oxlint: [],
  fumadocs: [],
  opentui: [],
  wxt: [],
  skills: [],
  evlog: [],
  none: [],
} as const;
