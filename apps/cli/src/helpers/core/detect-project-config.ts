import path from "node:path";

import { Result } from "better-result";
import fs from "fs-extra";

import { readBtsConfig } from "../../utils/bts-config";

export async function detectProjectConfig(projectDir: string) {
  const result = await Result.tryPromise({
    try: async () => {
      const btsConfig = await readBtsConfig(projectDir);
      if (btsConfig) {
        return {
          projectDir,
          projectName: path.basename(projectDir),
          ecosystem: btsConfig.ecosystem,
          addonOptions: btsConfig.addonOptions,
          dbSetupOptions: btsConfig.dbSetupOptions,
          database: btsConfig.database,
          orm: btsConfig.orm,
          backend: btsConfig.backend,
          runtime: btsConfig.runtime,
          frontend: btsConfig.frontend,
          addons: btsConfig.addons,
          examples: btsConfig.examples,
          auth: btsConfig.auth,
          payments: btsConfig.payments,
          packageManager: btsConfig.packageManager,
          dbSetup: btsConfig.dbSetup,
          api: btsConfig.api,
          webDeploy: btsConfig.webDeploy,
          serverDeploy: btsConfig.serverDeploy,
          pythonApp: btsConfig.pythonApp,
          pythonOrm: btsConfig.pythonOrm,
          pythonMl: btsConfig.pythonMl,
          pythonGenai: btsConfig.pythonGenai,
          pythonAgents: btsConfig.pythonAgents,
          accelerator: btsConfig.accelerator,
          pythonStarter: btsConfig.pythonStarter,
        };
      }

      return null;
    },
    catch: () => null,
  });

  return result.isOk() ? result.value : null;
}

export async function isBetterTStackProject(projectDir: string): Promise<boolean> {
  const result = await Result.tryPromise({
    try: () => fs.pathExists(path.join(projectDir, "bts.jsonc")),
    catch: () => false,
  });

  return result.isOk() ? result.value : false;
}
