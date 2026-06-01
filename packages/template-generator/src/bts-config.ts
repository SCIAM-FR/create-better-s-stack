import type { BetterTStackConfig, ProjectConfig } from "@better-s-stack/types";

import type { VirtualFileSystem } from "./core/virtual-fs";

const BTS_CONFIG_FILE = "bts.jsonc";

/**
 * Writes the BTS configuration file to the VFS (for new project creation).
 * This is browser-safe as it only writes to VFS, not the real filesystem.
 */
export function writeBtsConfigToVfs(
  vfs: VirtualFileSystem,
  projectConfig: ProjectConfig,
  version: string,
  reproducibleCommand?: string,
): void {
  const btsConfig: BetterTStackConfig = {
    version,
    createdAt: new Date().toISOString(),
    reproducibleCommand,
    ecosystem: projectConfig.ecosystem,
    pythonApp: projectConfig.pythonApp,
    pythonOrm: projectConfig.pythonOrm,
    pythonMl: projectConfig.pythonMl,
    pythonGenai: projectConfig.pythonGenai,
    pythonAgents: projectConfig.pythonAgents,
    accelerator: projectConfig.accelerator,
    pythonStarter: projectConfig.pythonStarter,
    addonOptions: projectConfig.addonOptions,
    dbSetupOptions: projectConfig.dbSetupOptions,
    database: projectConfig.database,
    orm: projectConfig.orm,
    backend: projectConfig.backend,
    runtime: projectConfig.runtime,
    frontend: projectConfig.frontend,
    addons: projectConfig.addons,
    examples: projectConfig.examples,
    auth: projectConfig.auth,
    payments: projectConfig.payments,
    packageManager: projectConfig.packageManager,
    dbSetup: projectConfig.dbSetup,
    api: projectConfig.api,
    webDeploy: projectConfig.webDeploy,
    serverDeploy: projectConfig.serverDeploy,
  };

  const baseContent = {
    $schema: "https://r2.better-t-stack.dev/schema.json",
    ...btsConfig,
  };

  const jsonContent = JSON.stringify(baseContent, null, 2);

  const addCommand =
    projectConfig.packageManager === "npm"
      ? "npx @sciam-fr/create-better-s-stack add"
      : projectConfig.packageManager === "pnpm"
        ? "pnpm dlx @sciam-fr/create-better-s-stack add"
        : "bunx @sciam-fr/create-better-s-stack add";

  const finalContent = `// Better-S-Stack
//
// Website: https://better-s-stack.sciam.fr/
// Stack Builder: https://better-s-stack.sciam.fr/new
// Analytics: https://better-s-stack.sciam.fr/analytics
// Showcase: https://better-s-stack.sciam.fr/showcase
// Sponsor: https://github.com/sponsors/SCIAM-FR
//
// Add new addons with: ${addCommand}
// This file is safe to delete

${jsonContent}`;

  vfs.writeFile(BTS_CONFIG_FILE, finalContent);
}
