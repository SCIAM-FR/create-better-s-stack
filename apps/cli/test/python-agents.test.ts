import { describe, expect, it } from "bun:test";

import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// A python project carrying the Agents capability pack (Slice 9). Picks add
// additive `[project.optional-dependencies]` groups and compose with the light
// GenAI clients.
function pythonAgents(overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-agents",
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

async function agentFiles(overrides: Overrides = {}) {
  const result = await pythonAgents(overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

describe("python Agents capability pack", () => {
  it("emits an `agents` optional-dependency group composing with a light client", async () => {
    const files = await agentFiles({ pythonAgents: ["langgraph"], pythonGenai: ["anthropic"] });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("agents = [");
    expect(pyproject).toContain("langgraph");
    expect(pyproject).toContain("langchain-core");
    expect(pyproject).toContain("llm = [");
    expect(pyproject).toContain("anthropic>=0.40");
  });

  it("emits an agent-loop starter only when pythonStarter is on", async () => {
    const off = await agentFiles({ pythonAgents: ["crewai"] });
    expect(off.has("agent.py")).toBe(false);

    const on = await agentFiles({ pythonAgents: ["crewai"], pythonStarter: true });
    const agent = on.get("agent.py") ?? "";
    expect(agent).toContain("crewai");
  });
});
