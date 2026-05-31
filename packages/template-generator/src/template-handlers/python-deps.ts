import type {
  Accelerator,
  Database,
  ProjectConfig,
  PythonAgents,
  PythonGenai,
  PythonMl,
  PythonOrm,
} from "@better-t-stack/types";

/**
 * Pure dependency-resolution helpers for the python capability packs
 * (Slices 6–8). These build TOML fragments from a Project Configuration with no
 * filesystem access, so they are unit-testable in isolation; `processPythonPyproject`
 * (below) is the single seam that injects them into the generated `pyproject.toml`.
 */

// Heavy GenAI packs own the torch dependency graph (pin specific torch/transformers
// versions) and imply a GPU. Light clients are pure HTTP and compose with anything.
export const HEAVY_GENAI: PythonGenai[] = [
  "transformers",
  "vllm",
  "unsloth",
  "trl",
  "peft",
  "accelerate",
];

// The mutually-exclusive heavy stacks: they pin conflicting torch/transformers
// versions, so at most one may be selected (enforced by the array superRefine).
export const CONFLICTING_HEAVY_GENAI: PythonGenai[] = ["vllm", "unsloth", "trl"];

export function isHeavyGenai(pick: PythonGenai): boolean {
  return HEAVY_GENAI.includes(pick);
}

export function hasHeavyGenai(config: Partial<ProjectConfig>): boolean {
  return (config.pythonGenai ?? []).some(isHeavyGenai);
}

/**
 * torch-based picks: the `pytorch` ML pack plus any heavy GenAI pack. These are
 * the only picks that surface the `accelerator` question and the per-accelerator
 * wheel wiring; `tensorflow`/`jax` do not trigger it in v1.
 */
export function usesTorch(config: Partial<ProjectConfig>): boolean {
  return (config.pythonMl ?? []).includes("pytorch") || hasHeavyGenai(config);
}

// ── ORM (Slice 6) ─────────────────────────────────────────────────────────

function syncDriver(database: Database | undefined): string | null {
  switch (database) {
    case "postgres":
      return "psycopg[binary]>=3.2";
    case "mysql":
      return "pymysql>=1.1";
    default:
      return null; // sqlite is stdlib; none → no driver
  }
}

function asyncDriver(database: Database | undefined): string | null {
  switch (database) {
    case "postgres":
      return "asyncpg>=0.29";
    case "mysql":
      return "aiomysql>=0.2";
    default:
      return null;
  }
}

/**
 * Runtime dependencies for the selected Python ORM, honoring `database`
 * (sqlite/postgres/mysql). SQL-only in v1 — mongodb is rejected upstream by
 * `validatePythonConstraints`.
 */
export function ormDependencies(
  orm: PythonOrm | undefined,
  database: Database | undefined,
): string[] {
  if (!orm || orm === "none") return [];

  if (orm === "tortoise") {
    // Tortoise is async-native and ships its own driver story.
    const deps = ["tortoise-orm>=0.21"];
    const driver = asyncDriver(database);
    if (driver) deps.push(driver);
    return deps;
  }

  const deps = orm === "sqlmodel" ? ["sqlmodel>=0.0.21"] : ["sqlalchemy>=2.0"];
  const driver = syncDriver(database);
  if (driver) deps.push(driver);
  return deps;
}

// ── Capability-pack optional-dependencies (Slices 7–8) ──────────────────────

const ML_DEPS: Record<PythonMl, string[]> = {
  "scikit-learn": ["scikit-learn>=1.5"],
  pytorch: ["torch>=2.4", "torchvision>=0.19"],
  tensorflow: ["tensorflow>=2.17"],
  jax: ["jax>=0.4"],
  xgboost: ["xgboost>=2.1"],
  lightgbm: ["lightgbm>=4.5"],
};

const GENAI_LIGHT_DEPS: Partial<Record<PythonGenai, string[]>> = {
  openai: ["openai>=1.0"],
  anthropic: ["anthropic>=0.40"],
  "google-genai": ["google-genai>=0.3"],
  litellm: ["litellm>=1.50"],
};

const AGENTS_DEPS: Record<PythonAgents, string[]> = {
  langgraph: ["langgraph", "langchain-core"],
  "openai-agents": ["openai-agents"],
  "claude-agent-sdk": ["claude-agent-sdk"],
  "pydantic-ai": ["pydantic-ai"],
  llamaindex: ["llama-index"],
  crewai: ["crewai"],
  autogen: ["autogen-agentchat"],
};

/**
 * Maps the capability-pack multi-selects to `[project.optional-dependencies]`
 * groups, installed on demand via `uv sync --extra <group>`:
 *  - `ml`    — ML packs
 *  - `llm`   — light GenAI HTTP clients (compose with anything)
 *  - `serve` — vllm (heavy serve path)
 *  - `train` — heavy train/fine-tune packs (unsloth/trl/peft/transformers/accelerate)
 *  - `agents`— agents packs
 */
export function optionalDependencies(config: Partial<ProjectConfig>): Record<string, string[]> {
  const ml = config.pythonMl ?? [];
  const genai = config.pythonGenai ?? [];
  const agents = config.pythonAgents ?? [];
  const groups: Record<string, string[]> = {};

  const mlDeps = ml.flatMap((pick) => ML_DEPS[pick] ?? []);
  if (mlDeps.length) groups.ml = mlDeps;

  const llmDeps = genai.flatMap((pick) => GENAI_LIGHT_DEPS[pick] ?? []);
  if (llmDeps.length) groups.llm = llmDeps;

  if (genai.includes("vllm")) groups.serve = ["vllm>=0.6"];

  const trainDeps: string[] = [];
  if (genai.includes("unsloth")) trainDeps.push("unsloth");
  if (genai.includes("trl")) trainDeps.push("trl>=0.11");
  if (genai.includes("peft")) trainDeps.push("peft>=0.13");
  if (genai.includes("transformers")) trainDeps.push("transformers>=4.45");
  if (genai.includes("accelerate")) trainDeps.push("accelerate>=1.0");
  if (trainDeps.length) groups.train = trainDeps;

  const agentDeps = agents.flatMap((pick) => AGENTS_DEPS[pick] ?? []);
  if (agentDeps.length) groups.agents = agentDeps;

  return groups;
}

// ── Accelerator wiring (Slice 7) ────────────────────────────────────────────

const PYTORCH_INDEX: Record<Accelerator, { name: string; url: string } | null> = {
  cpu: null, // default PyPI — no explicit index, plain torch
  cu121: { name: "pytorch-cu121", url: "https://download.pytorch.org/whl/cu121" },
  cu124: { name: "pytorch-cu124", url: "https://download.pytorch.org/whl/cu124" },
  rocm: { name: "pytorch-rocm", url: "https://download.pytorch.org/whl/rocm6.2" },
};

export function acceleratorIndex(accelerator: Accelerator): { name: string; url: string } | null {
  return PYTORCH_INDEX[accelerator];
}

// ── requires-python floor (Slice 7) ─────────────────────────────────────────

/**
 * Computes the `requires-python` floor from the selected packs rather than
 * hardcoding — vllm in particular constrains the interpreter version.
 */
export function requiresPython(config: Partial<ProjectConfig>): string {
  const genai = config.pythonGenai ?? [];
  // vllm pins a tight interpreter window.
  if (genai.includes("vllm")) return ">=3.9,<3.13";
  return ">=3.10";
}

// ── Conflicts (Slice 8) ─────────────────────────────────────────────────────

/**
 * The mutually-exclusive resolver layer: when both a serve (vllm) and a train
 * (unsloth/trl/…) extra are present they pin conflicting torch graphs, so uv is
 * told to never resolve them together.
 */
export function genaiConflictsBlock(groups: Record<string, string[]>): string {
  if (groups.serve && groups.train) {
    return [
      "[tool.uv]",
      "conflicts = [",
      '    [{ extra = "serve" }, { extra = "train" }],',
      "]",
    ].join("\n");
  }
  return "";
}

// ── pyproject.toml injection ────────────────────────────────────────────────

function injectIntoDependencies(toml: string, deps: string[]): string {
  if (deps.length === 0) return toml;
  const lines = deps.map((d) => `    "${d}",`).join("\n");

  // Empty array form: `dependencies = []`
  const emptyMatch = /^dependencies = \[\]\s*$/m;
  if (emptyMatch.test(toml)) {
    return toml.replace(emptyMatch, `dependencies = [\n${lines}\n]`);
  }

  // Multiline form: insert before the closing `]` of the project deps array.
  const start = toml.indexOf("dependencies = [");
  if (start === -1) return toml;
  const close = toml.indexOf("\n]", start);
  if (close === -1) return toml;
  return `${toml.slice(0, close)}\n${lines}${toml.slice(close)}`;
}

function renderGroups(groups: Record<string, string[]>): string {
  return Object.entries(groups)
    .map(([name, deps]) => `${name} = [${deps.map((d) => `"${d}"`).join(", ")}]`)
    .join("\n");
}

function injectOptionalDependencies(toml: string, groups: Record<string, string[]>): string {
  if (Object.keys(groups).length === 0) return toml;
  const rendered = renderGroups(groups);

  const header = /^\[project\.optional-dependencies\]\s*$/m;
  if (header.test(toml)) {
    return toml.replace(header, `[project.optional-dependencies]\n${rendered}`);
  }
  return `${toml.trimEnd()}\n\n[project.optional-dependencies]\n${rendered}\n`;
}

function mergeAcceleratorWiring(toml: string, config: Partial<ProjectConfig>): string {
  const idx = acceleratorIndex(config.accelerator ?? "cpu");
  if (!idx) return toml; // cpu — no explicit index

  const sources = [`torch = [{ index = "${idx.name}", marker = "sys_platform == 'linux'" }]`];
  if ((config.pythonMl ?? []).includes("pytorch")) {
    sources.push(`torchvision = [{ index = "${idx.name}", marker = "sys_platform == 'linux'" }]`);
  }
  const sourceLines = sources.join("\n");

  let out = toml;
  const sourcesHeader = /^\[tool\.uv\.sources\]\s*$/m;
  if (sourcesHeader.test(out)) {
    out = out.replace(sourcesHeader, `[tool.uv.sources]\n${sourceLines}`);
  } else {
    out = `${out.trimEnd()}\n\n[tool.uv.sources]\n${sourceLines}\n`;
  }

  const indexBlock = `[[tool.uv.index]]\nname = "${idx.name}"\nurl = "${idx.url}"\nexplicit = true`;
  return `${out.trimEnd()}\n\n${indexBlock}\n`;
}

function appendBlock(toml: string, block: string): string {
  if (!block) return toml;
  return `${toml.trimEnd()}\n\n${block}\n`;
}

/**
 * The single capability-layering seam: reads the generated root `pyproject.toml`,
 * threads ORM deps, capability-pack extras, the per-accelerator torch wiring,
 * the `requires-python` floor, and the heavy-GenAI conflicts into it, then writes
 * it back. A no-op for the TS ecosystem and for configs with no packs/ORM.
 */
export function processPythonPyproject(
  vfs: { readFile(p: string): string | undefined; writeFile(p: string, c: string): void },
  config: Partial<ProjectConfig>,
): void {
  if (config.ecosystem !== "python") return;
  const path = "pyproject.toml";
  let toml = vfs.readFile(path);
  if (!toml) return;

  toml = toml.replace(/requires-python = "[^"]*"/, `requires-python = "${requiresPython(config)}"`);

  toml = injectIntoDependencies(toml, ormDependencies(config.pythonOrm, config.database));

  const groups = optionalDependencies(config);
  toml = injectOptionalDependencies(toml, groups);

  if (usesTorch(config)) {
    toml = mergeAcceleratorWiring(toml, config);
  }

  toml = appendBlock(toml, genaiConflictsBlock(groups));

  vfs.writeFile(path, toml);
}
