import { describe, expect, test } from "bun:test";

import {
  getCompatibilityAdjustmentKey,
  getCompatibilityAdjustmentState,
} from "../src/app/(home)/new/_components/stack-builder/use-stack-builder";
import {
  analyzeStackCompatibility,
  getDisabledReason,
} from "../src/app/(home)/new/_components/utils";
import { DEFAULT_STACK, type StackState } from "../src/lib/constant";
import { generateStackCommand } from "../src/lib/stack-utils";

function createStack(overrides: Partial<StackState> = {}): StackState {
  return {
    ...DEFAULT_STACK,
    ...overrides,
    webFrontend: [...(overrides.webFrontend ?? DEFAULT_STACK.webFrontend)],
    nativeFrontend: [...(overrides.nativeFrontend ?? DEFAULT_STACK.nativeFrontend)],
    addons: [...(overrides.addons ?? DEFAULT_STACK.addons)],
    examples: [...(overrides.examples ?? DEFAULT_STACK.examples)],
  };
}

describe("stack builder D1 compatibility", () => {
  test("keeps self fullstack backends on the D1 + Cloudflare path", () => {
    const stack = createStack({
      backend: "self-next",
      webFrontend: ["next"],
      runtime: "none",
      database: "sqlite",
      orm: "drizzle",
      dbSetup: "d1",
      webDeploy: "none",
      serverDeploy: "none",
    });

    const result = analyzeStackCompatibility(stack);

    expect(result.adjustedStack).toMatchObject({
      backend: "self-next",
      runtime: "none",
      database: "sqlite",
      dbSetup: "d1",
      webDeploy: "cloudflare",
      serverDeploy: "none",
    });
  });

  test("still routes non-self D1 stacks through workers + cloudflare", () => {
    const stack = createStack({
      backend: "hono",
      runtime: "bun",
      database: "sqlite",
      orm: "drizzle",
      dbSetup: "d1",
      serverDeploy: "none",
    });

    const result = analyzeStackCompatibility(stack);

    expect(result.adjustedStack).toMatchObject({
      backend: "hono",
      runtime: "workers",
      database: "sqlite",
      dbSetup: "d1",
      serverDeploy: "cloudflare",
    });
  });

  test("allows selecting D1 for self fullstack backends", () => {
    const stack = createStack({
      backend: "self-next",
      webFrontend: ["next"],
      runtime: "none",
      database: "sqlite",
    });

    expect(getDisabledReason(stack, "dbSetup", "d1")).toBeNull();
  });

  test("blocks non-cloudflare web deployment for self fullstack D1 stacks", () => {
    const stack = createStack({
      backend: "self-next",
      webFrontend: ["next"],
      runtime: "none",
      database: "sqlite",
      dbSetup: "d1",
      webDeploy: "cloudflare",
    });

    expect(getDisabledReason(stack, "webDeploy", "none")).toBe(
      "D1 with a self fullstack backend requires Cloudflare web deployment",
    );
  });

  test("reapplies the same D1 adjustment after leaving and returning to it", () => {
    const adjustedD1Stack = createStack({
      backend: "self-next",
      webFrontend: ["next"],
      runtime: "none",
      database: "sqlite",
      dbSetup: "d1",
      webDeploy: "cloudflare",
      serverDeploy: "none",
    });
    const initialRawD1Stack = createStack({
      ...adjustedD1Stack,
      webDeploy: "none",
    });
    const tursoStack = createStack({
      backend: "self-next",
      webFrontend: ["next"],
      runtime: "none",
      database: "sqlite",
      dbSetup: "turso",
      webDeploy: "none",
      serverDeploy: "none",
    });

    const firstAdjustment = getCompatibilityAdjustmentState("", initialRawD1Stack, adjustedD1Stack);
    const settledState = getCompatibilityAdjustmentState(
      firstAdjustment.adjustmentKey,
      tursoStack,
      null,
    );
    const secondAdjustment = getCompatibilityAdjustmentState(
      settledState.adjustmentKey,
      initialRawD1Stack,
      adjustedD1Stack,
    );

    expect(firstAdjustment.adjustmentKey).toBe(
      getCompatibilityAdjustmentKey(initialRawD1Stack, adjustedD1Stack),
    );
    expect(firstAdjustment.shouldApply).toBe(true);
    expect(settledState.adjustmentKey).toBe("");
    expect(settledState.shouldApply).toBe(false);
    expect(secondAdjustment.adjustmentKey).toBe(
      getCompatibilityAdjustmentKey(initialRawD1Stack, adjustedD1Stack),
    );
    expect(secondAdjustment.shouldApply).toBe(true);
  });

  test("allows Polar when there is no frontend at all", () => {
    const stack = createStack({
      webFrontend: ["none"],
      nativeFrontend: ["none"],
      backend: "hono",
      auth: "better-auth",
    });

    expect(getDisabledReason(stack, "payments", "polar")).toBeNull();
  });

  test("allows Polar for native-only stacks", () => {
    const stack = createStack({
      webFrontend: ["none"],
      nativeFrontend: ["native-bare"],
      backend: "hono",
      auth: "better-auth",
    });

    expect(getDisabledReason(stack, "payments", "polar")).toBeNull();
  });

  test("allows Polar for mixed web and native stacks", () => {
    const stack = createStack({
      webFrontend: ["tanstack-router"],
      nativeFrontend: ["native-bare"],
      backend: "hono",
      runtime: "bun",
      auth: "better-auth",
      payments: "polar",
    });

    expect(getDisabledReason(stack, "payments", "polar")).toBeNull();
    expect(analyzeStackCompatibility(stack).adjustedStack).toBeNull();

    const command = generateStackCommand(stack);
    expect(command).toContain("--frontend tanstack-router native-bare");
    expect(command).toContain("--payments polar");
  });

  test("allows Polar for mixed Convex Better Auth web and native stacks", () => {
    const stack = createStack({
      webFrontend: ["next"],
      nativeFrontend: ["native-bare"],
      backend: "convex",
      runtime: "none",
      database: "none",
      orm: "none",
      api: "none",
      dbSetup: "none",
      auth: "better-auth",
      payments: "polar",
    });

    expect(getDisabledReason(stack, "auth", "better-auth")).toBeNull();
    expect(getDisabledReason(stack, "payments", "polar")).toBeNull();
    expect(analyzeStackCompatibility(stack).adjustedStack).toBeNull();

    const command = generateStackCommand(stack);
    expect(command).toContain("--frontend next native-bare");
    expect(command).toContain("--backend convex");
    expect(command).toContain("--payments polar");
  });

  test("blocks the AI example for Astro frontends", () => {
    const stack = createStack({
      webFrontend: ["astro"],
      backend: "self-astro",
      api: "orpc",
    });

    expect(getDisabledReason(stack, "examples", "ai")).toBe(
      "AI example not compatible with Solid or Astro frontend",
    );

    const result = analyzeStackCompatibility({
      ...stack,
      examples: ["ai"],
    });

    expect(result.adjustedStack?.examples).toEqual(["none"]);
  });

  test("blocks Evlog for Convex stacks", () => {
    const stack = createStack({
      webFrontend: ["tanstack-start"],
      nativeFrontend: ["native-uniwind"],
      backend: "convex",
      runtime: "none",
      addons: ["turborepo"],
    });

    expect(getDisabledReason(stack, "addons", "evlog")).toBe(
      "evlog requires Hono, Express, Fastify, Elysia, or a fullstack backend",
    );
  });

  test("removes Evlog when a selected stack switches to Convex", () => {
    const stack = createStack({
      webFrontend: ["tanstack-start"],
      nativeFrontend: ["native-uniwind"],
      backend: "convex",
      runtime: "none",
      addons: ["turborepo", "evlog"],
    });

    const result = analyzeStackCompatibility(stack);

    expect(result.adjustedStack?.addons).toEqual(["turborepo"]);
    expect(result.changes).toContainEqual({
      category: "addons",
      message: "evlog removed (requires a server or fullstack backend)",
    });
  });

  test("allows Evlog for server and fullstack stacks", () => {
    const serverStack = createStack({
      backend: "hono",
      runtime: "bun",
    });
    const fullstackStack = createStack({
      webFrontend: ["tanstack-start"],
      backend: "self-tanstack-start",
      runtime: "none",
    });

    expect(getDisabledReason(serverStack, "addons", "evlog")).toBeNull();
    expect(getDisabledReason(fullstackStack, "addons", "evlog")).toBeNull();
  });
});

describe("stack builder python ecosystem", () => {
  test("ts mode is the default and command is unchanged", () => {
    const stack = createStack();
    expect(stack.ecosystem).toBe("ts");
    expect(generateStackCommand(stack)).toContain("--yes");
  });

  test("switching to python collapses the TS-only fields to inert values", () => {
    const stack = createStack({
      ecosystem: "python",
      pythonApp: "fastapi",
      backend: "hono",
      runtime: "bun",
      api: "trpc",
      orm: "drizzle",
      auth: "better-auth",
      webFrontend: ["tanstack-router"],
      addons: ["turborepo"],
    });

    const result = analyzeStackCompatibility(stack);
    expect(result.adjustedStack).toMatchObject({
      backend: "none",
      runtime: "none",
      api: "none",
      orm: "none",
      auth: "none",
      webFrontend: ["none"],
      addons: ["none"],
    });
  });

  test("generates a python command carrying the --python-* flags", () => {
    const stack = createStack({
      ecosystem: "python",
      pythonApp: "fastapi",
      pythonOrm: "sqlalchemy",
      database: "postgres",
      pythonMl: ["pytorch"],
      accelerator: "cu124",
      pythonStarter: "true",
    });

    const command = generateStackCommand(stack);
    expect(command).toContain("--ecosystem python");
    expect(command).toContain("--python-app fastapi");
    expect(command).toContain("--python-orm sqlalchemy");
    expect(command).toContain("--database postgres");
    expect(command).toContain("--python-ml pytorch");
    expect(command).toContain("--accelerator cu124");
    expect(command).toContain("--python-starter");
    expect(command).toContain("--package-manager uv");
    // Python uses the same JS-runner bootstrap as TypeScript; default pm is bun.
    expect(command.startsWith("bun create @sciam-fr/better-s-stack@latest")).toBe(true);
  });

  test("rejects MongoDB in python mode (SQL only)", () => {
    const stack = createStack({ ecosystem: "python", pythonApp: "fastapi" });
    expect(getDisabledReason(stack, "database", "mongodb")).not.toBeNull();
    expect(getDisabledReason(stack, "database", "postgres")).toBeNull();
  });

  test("auto-adjusts MongoDB to none in python mode", () => {
    const stack = createStack({
      ecosystem: "python",
      pythonApp: "fastapi",
      database: "mongodb",
    });
    const result = analyzeStackCompatibility(stack);
    expect(result.adjustedStack).toMatchObject({ database: "none" });
  });

  test("heavy GenAI requires a GPU accelerator", () => {
    const stack = createStack({
      ecosystem: "python",
      pythonApp: "fastapi",
      pythonGenai: ["vllm"],
      accelerator: "cpu",
    });
    // cpu is disabled at prompt time...
    expect(getDisabledReason(stack, "accelerator", "cpu")).not.toBeNull();
    // ...and auto-bumped to a GPU.
    const result = analyzeStackCompatibility(stack);
    expect(result.adjustedStack?.accelerator).not.toBe("cpu");
  });

  test("only one of vllm/unsloth/trl can be selected", () => {
    const stack = createStack({
      ecosystem: "python",
      pythonApp: "fastapi",
      pythonGenai: ["vllm"],
      accelerator: "cu124",
    });
    // Selecting a second conflicting heavy pack is blocked at prompt time.
    expect(getDisabledReason(stack, "pythonGenai", "unsloth")).not.toBeNull();
    // A light client still composes.
    expect(getDisabledReason(stack, "pythonGenai", "anthropic")).toBeNull();

    // And the analyzer dedupes if both somehow end up selected.
    const both = createStack({
      ecosystem: "python",
      pythonApp: "fastapi",
      pythonGenai: ["vllm", "unsloth"],
      accelerator: "cu124",
    });
    const result = analyzeStackCompatibility(both);
    const genai = result.adjustedStack?.pythonGenai ?? both.pythonGenai;
    const conflicting = genai.filter((id) => ["vllm", "unsloth", "trl"].includes(id));
    expect(conflicting).toHaveLength(1);
  });
});
