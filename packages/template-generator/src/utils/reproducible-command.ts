import type { ProjectConfig } from "@better-t-stack/types";

function normalizeMultiValues(values: string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  const filtered = values.filter((value) => value !== "none");
  return Array.from(new Set(filtered));
}

function formatMultiFlag(flag: string, values: string[]): string {
  if (values.length === 0) {
    return `${flag} none`;
  }
  return `${flag} ${values.join(" ")}`;
}

function getBaseCommand(packageManager: ProjectConfig["packageManager"]): string {
  if (packageManager === "bun") {
    return "bun create better-t-stack@latest";
  }

  if (packageManager === "pnpm") {
    return "pnpm create better-t-stack@latest";
  }

  return "npx create-better-t-stack@latest";
}

export function generateReproducibleCommand(config: ProjectConfig): string {
  const baseCommand = getBaseCommand(config.packageManager);

  const flags: string[] = [];
  const frontend = normalizeMultiValues(config.frontend);
  const addons = normalizeMultiValues(config.addons);
  const examples = normalizeMultiValues(config.examples);

  flags.push(formatMultiFlag("--frontend", frontend));

  flags.push(`--backend ${config.backend}`);
  flags.push(`--runtime ${config.runtime}`);
  flags.push(`--database ${config.database}`);
  flags.push(`--orm ${config.orm}`);
  flags.push(`--api ${config.api}`);
  flags.push(`--auth ${config.auth}`);
  flags.push(`--payments ${config.payments}`);

  flags.push(formatMultiFlag("--addons", addons));
  flags.push(formatMultiFlag("--examples", examples));

  flags.push(`--db-setup ${config.dbSetup}`);
  if (config.dbSetupOptions?.mode === "manual") {
    flags.push("--manual-db");
  }
  flags.push(`--web-deploy ${config.webDeploy}`);
  flags.push(`--server-deploy ${config.serverDeploy}`);
  flags.push(config.git ? "--git" : "--no-git");
  flags.push(`--package-manager ${config.packageManager}`);
  flags.push(config.install ? "--install" : "--no-install");

  // Python ecosystem flags — additive; emitted only for python configs so the
  // TS path stays byte-identical (plan §7 / Decision 3).
  if (config.ecosystem === "python") {
    flags.push(`--ecosystem ${config.ecosystem}`);
    flags.push(`--python-app ${config.pythonApp}`);
    flags.push(`--python-orm ${config.pythonOrm}`);
    flags.push(formatMultiFlag("--python-ml", normalizeMultiValues(config.pythonMl)));
    flags.push(formatMultiFlag("--python-genai", normalizeMultiValues(config.pythonGenai)));
    flags.push(formatMultiFlag("--python-agents", normalizeMultiValues(config.pythonAgents)));
    flags.push(`--accelerator ${config.accelerator}`);
    if (config.pythonStarter) {
      flags.push("--python-starter");
    }
  }

  const projectPathArg = config.relativePath ? ` ${config.relativePath}` : "";

  return `${baseCommand}${projectPathArg} ${flags.join(" ")}`;
}
