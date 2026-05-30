import { describe, expect, it } from "bun:test";

import { generateReproducibleCommand } from "../../../packages/template-generator/src/utils/reproducible-command";
import {
  BetterTStackConfigSchema,
  CreateInputSchema,
  EcosystemSchema,
  ProjectConfigSchema,
} from "../../../packages/types/src/schemas";
import { DEFAULT_CONFIG } from "../src/constants";
import { createVirtual } from "../src/index";
import { gatherConfig } from "../src/prompts/config-prompts";
import type { CLIInput } from "../src/types";
import { processFlags } from "../src/utils/config-processing";
import { runWithContextAsync } from "../src/utils/context";

describe("ecosystem discriminator skeleton", () => {
  it("resolves an unspecified ecosystem to ts at the schema boundary", () => {
    expect(EcosystemSchema.parse(undefined)).toBe("ts");
  });

  it("carries the ts ecosystem on the default Project Configuration", () => {
    expect(DEFAULT_CONFIG.ecosystem).toBe("ts");
  });
});

/**
 * Reflective field-plumbing guardrail (plan §10 / Decision 7).
 *
 * Every stack-choice field on a Project Configuration must round-trip through
 * all four surfaces: the default config, the silent config-construction path,
 * the persisted bts.jsonc schema, and the reproducible command. Structural,
 * optional, and action fields are exempt (they are intentionally not threaded
 * uniformly). Adding a schema field without wiring it everywhere fails here.
 */
describe("Project Configuration field plumbing", () => {
  // The single named allowlist: fields that are NOT stack-choice config and are
  // intentionally absent from one or more persistence/reproduce surfaces.
  const NON_STACK_FIELDS = new Set([
    "projectName",
    "projectDir",
    "relativePath",
    "addonOptions",
    "dbSetupOptions",
    "git",
    "install",
  ]);

  const stackFields = Object.keys(ProjectConfigSchema.shape).filter(
    (key) => !NON_STACK_FIELDS.has(key),
  );

  // A maximal python Project Configuration so every conditional flag is emitted.
  const pythonSample = {
    ...DEFAULT_CONFIG,
    projectDir: "/virtual",
    relativePath: "virtual",
    ecosystem: "python",
    packageManager: "uv",
    frontend: [],
    backend: "none",
    api: "none",
    orm: "none",
    auth: "none",
    payments: "none",
    runtime: "none",
    pythonApp: "fastapi",
    pythonOrm: "sqlalchemy",
    pythonMl: ["pytorch"],
    pythonGenai: ["anthropic"],
    pythonAgents: ["langgraph"],
    accelerator: "cu124",
    pythonStarter: true,
    // biome-ignore lint/suspicious/noExplicitAny: forward-declared python fields
  } as any;

  const reproducibleCommand = generateReproducibleCommand(pythonSample);

  const btsShape = BetterTStackConfigSchema.shape as Record<string, unknown>;

  // A maximal flag set (every array non-empty) run through the flag→config
  // builder. This guards the surface that originally dropped the python fields:
  // processFlags only copies *provided* options, so every stack field set as a
  // flag must survive into the config it returns.
  const maximalFlags = {
    ecosystem: "python",
    frontend: ["tanstack-router"],
    backend: "hono",
    runtime: "bun",
    database: "sqlite",
    orm: "drizzle",
    api: "trpc",
    auth: "better-auth",
    payments: "polar",
    addons: ["turborepo"],
    examples: ["todo"],
    dbSetup: "turso",
    packageManager: "uv",
    webDeploy: "cloudflare",
    serverDeploy: "cloudflare",
    pythonApp: "fastapi",
    pythonOrm: "sqlalchemy",
    pythonMl: ["pytorch"],
    pythonGenai: ["anthropic"],
    pythonAgents: ["langgraph"],
    accelerator: "cu124",
    pythonStarter: true,
    // biome-ignore lint/suspicious/noExplicitAny: a maximal, intentionally cross-ecosystem flag bag
  } as any as CLIInput;
  const flagConfig = processFlags(maximalFlags, "plumbing-check") as Record<string, unknown>;

  const expectedFlag = (key: string) => `--${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

  it("has at least the known TS stack fields under guard", () => {
    expect(stackFields.length).toBeGreaterThanOrEqual(14);
  });

  for (const key of stackFields) {
    describe(`${key}`, () => {
      it("appears in DEFAULT_CONFIG", () => {
        expect(Object.hasOwn(DEFAULT_CONFIG, key)).toBe(true);
      });

      it("is produced by the silent config path", async () => {
        const silentConfig = await runWithContextAsync({ silent: true }, () =>
          gatherConfig({}, "plumbing-check", "/virtual", "virtual"),
        );
        expect(Object.hasOwn(silentConfig, key)).toBe(true);
      });

      it("is persisted in the bts.jsonc schema", () => {
        expect(Object.hasOwn(btsShape, key)).toBe(true);
      });

      it("is echoed in the reproducible command", () => {
        expect(reproducibleCommand).toContain(expectedFlag(key));
      });

      it("is copied by processFlags when provided as a flag", () => {
        expect(Object.hasOwn(flagConfig, key)).toBe(true);
      });
    });
  }
});

describe("ecosystem skeleton — python is additive and gated", () => {
  it("accepts a python config through the create input schema", () => {
    const result = CreateInputSchema.safeParse({
      projectName: "py-app",
      ecosystem: "python",
      pythonApp: "fastapi",
      pythonOrm: "sqlalchemy",
      pythonMl: ["pytorch"],
      pythonGenai: ["vllm"],
      pythonAgents: ["langgraph"],
      accelerator: "cu124",
      pythonStarter: true,
      packageManager: "uv",
    });

    expect(result.success).toBe(true);
  });

  it("rejects more than one heavy GenAI pack via the single array superRefine", () => {
    const result = CreateInputSchema.safeParse({
      projectName: "py-app",
      ecosystem: "python",
      pythonGenai: ["vllm", "unsloth"],
    });

    expect(result.success).toBe(false);
  });

  it("routes python configs to the python generator seam (python output, not the TS pipeline)", async () => {
    const result = await createVirtual({ ecosystem: "python", pythonApp: "library" });

    expect(result.isOk()).toBe(true);
  });

  it("leaves the TS ecosystem out of the reproducible command", () => {
    const command = generateReproducibleCommand({
      ...DEFAULT_CONFIG,
      projectDir: "/virtual",
      relativePath: "virtual",
      // biome-ignore lint/suspicious/noExplicitAny: test config shim
    } as any);

    expect(command).not.toContain("--ecosystem");
    expect(command).not.toContain("--python");
  });
});
