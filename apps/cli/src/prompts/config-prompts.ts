import { DEFAULT_CONFIG, PYTHON_TS_FIELD_DEFAULTS } from "../constants";
import type {
  Accelerator,
  Addons,
  API,
  Auth,
  Backend,
  Database,
  DatabaseSetup,
  Ecosystem,
  Examples,
  Frontend,
  ORM,
  PackageManager,
  Payments,
  ProjectConfig,
  PythonAgents,
  PythonApp,
  PythonGenai,
  PythonMl,
  PythonOrm,
  Runtime,
  ServerDeploy,
  WebDeploy,
} from "../types";
import { isSilent } from "../utils/context";
import { UserCancelledError } from "../utils/errors";
import { getAddonsChoice } from "./addons";
import { getApiChoice } from "./api";
import { getAuthChoice } from "./auth";
import { getBackendFrameworkChoice } from "./backend";
import { getDatabaseChoice } from "./database";
import { getDBSetupChoice } from "./database-setup";
import { getEcosystemChoice } from "./ecosystem";
import { getExamplesChoice } from "./examples";
import { getFrontendChoice } from "./frontend";
import { getGitChoice } from "./git";
import { getinstallChoice } from "./install";
import { navigableGroup } from "./navigable-group";
import { getORMChoice } from "./orm";
import { getPackageManagerChoice } from "./package-manager";
import { getPaymentsChoice } from "./payments";
import { getPythonAppChoice } from "./python-app";
import {
  getAcceleratorChoice,
  getPythonAgentsChoice,
  getPythonGenaiChoice,
  getPythonMlChoice,
  getPythonOrmChoice,
  getPythonStarterChoice,
} from "./python-capabilities";
import { getRuntimeChoice } from "./runtime";
import { getServerDeploymentChoice } from "./server-deploy";
import { getDeploymentChoice } from "./web-deploy";

type PromptGroupResults = {
  ecosystem: Ecosystem;
  frontend: Frontend[];
  backend: Backend;
  runtime: Runtime;
  database: Database;
  orm: ORM;
  api: API;
  auth: Auth;
  payments: Payments;
  addons: Addons[];
  examples: Examples[];
  dbSetup: DatabaseSetup;
  git: boolean;
  packageManager: PackageManager;
  install: boolean;
  webDeploy: WebDeploy;
  serverDeploy: ServerDeploy;
  pythonApp: PythonApp;
  pythonOrm: PythonOrm;
  pythonMl: PythonMl[];
  pythonGenai: PythonGenai[];
  pythonAgents: PythonAgents[];
  accelerator: Accelerator;
  pythonStarter: boolean;
};

export async function gatherConfig(
  flags: Partial<ProjectConfig>,
  projectName: string,
  projectDir: string,
  relativePath: string,
) {
  if (isSilent()) {
    // For python, the TS stack fields default to the shared inert projection
    // (plan §3.3 / Decision 5) instead of the TS defaults, so a python config
    // built from flags alone is well-formed. `database` defaults to `none` for
    // python (it may still be overridden by a flag — Slice 06).
    const ecosystem = flags.ecosystem ?? DEFAULT_CONFIG.ecosystem;
    const d =
      ecosystem === "python"
        ? { ...DEFAULT_CONFIG, ...PYTHON_TS_FIELD_DEFAULTS, database: "none" as const }
        : DEFAULT_CONFIG;

    return {
      projectName,
      projectDir,
      relativePath,
      ecosystem,
      pythonApp: flags.pythonApp ?? DEFAULT_CONFIG.pythonApp,
      pythonOrm: flags.pythonOrm ?? DEFAULT_CONFIG.pythonOrm,
      pythonMl: flags.pythonMl ?? [...DEFAULT_CONFIG.pythonMl],
      pythonGenai: flags.pythonGenai ?? [...DEFAULT_CONFIG.pythonGenai],
      pythonAgents: flags.pythonAgents ?? [...DEFAULT_CONFIG.pythonAgents],
      accelerator: flags.accelerator ?? DEFAULT_CONFIG.accelerator,
      pythonStarter: flags.pythonStarter ?? DEFAULT_CONFIG.pythonStarter,
      addonOptions: flags.addonOptions,
      dbSetupOptions: flags.dbSetupOptions,
      frontend: flags.frontend ?? [...d.frontend],
      backend: flags.backend ?? d.backend,
      runtime: flags.runtime ?? d.runtime,
      database: flags.database ?? d.database,
      orm: flags.orm ?? d.orm,
      auth: flags.auth ?? d.auth,
      payments: flags.payments ?? d.payments,
      addons: flags.addons ?? [...d.addons],
      examples: flags.examples ?? [...d.examples],
      git: flags.git ?? DEFAULT_CONFIG.git,
      packageManager: flags.packageManager ?? d.packageManager,
      install: flags.install ?? DEFAULT_CONFIG.install,
      dbSetup: flags.dbSetup ?? d.dbSetup,
      api: flags.api ?? d.api,
      webDeploy: flags.webDeploy ?? d.webDeploy,
      serverDeploy: flags.serverDeploy ?? d.serverDeploy,
    };
  }

  const result = await navigableGroup<PromptGroupResults>(
    {
      ecosystem: () => getEcosystemChoice(flags.ecosystem),
      // Each TS-stack prompt is gated on the python ecosystem: under python it
      // returns the shared inert projection (no UI), so the interactive python
      // flow never asks TS questions (plan §3.3 / Decision 5).
      frontend: ({ results }) =>
        results.ecosystem === "python"
          ? [...PYTHON_TS_FIELD_DEFAULTS.frontend]
          : getFrontendChoice(flags.frontend, flags.backend, flags.auth),
      backend: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.backend
          : getBackendFrameworkChoice(flags.backend, results.frontend),
      runtime: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.runtime
          : getRuntimeChoice(flags.runtime, results.backend),
      database: ({ results }) =>
        results.ecosystem === "python"
          ? "none"
          : getDatabaseChoice(flags.database, results.backend, results.runtime),
      orm: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.orm
          : getORMChoice(
              flags.orm,
              results.database !== "none",
              results.database,
              results.backend,
              results.runtime,
            ),
      api: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.api
          : (getApiChoice(flags.api, results.frontend, results.backend) as Promise<API>),
      auth: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.auth
          : getAuthChoice(flags.auth, results.backend, results.frontend),
      payments: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.payments
          : getPaymentsChoice(flags.payments, results.auth, results.backend, results.frontend),
      addons: ({ results }) =>
        results.ecosystem === "python"
          ? [...PYTHON_TS_FIELD_DEFAULTS.addons]
          : getAddonsChoice(
              flags.addons,
              results.frontend,
              results.auth,
              results.backend,
              results.runtime,
            ),
      examples: ({ results }) =>
        results.ecosystem === "python"
          ? [...PYTHON_TS_FIELD_DEFAULTS.examples]
          : (getExamplesChoice(
              flags.examples,
              results.database,
              results.frontend,
              results.backend,
              results.api,
            ) as Promise<Examples[]>),
      dbSetup: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.dbSetup
          : getDBSetupChoice(
              results.database ?? "none",
              flags.dbSetup,
              results.orm,
              results.backend,
              results.runtime,
            ),
      webDeploy: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.webDeploy
          : getDeploymentChoice(
              flags.webDeploy,
              results.runtime,
              results.backend,
              results.frontend,
              results.dbSetup,
            ),
      serverDeploy: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.serverDeploy
          : getServerDeploymentChoice(
              flags.serverDeploy,
              results.runtime,
              results.backend,
              results.webDeploy,
            ),
      git: () => getGitChoice(flags.git),
      packageManager: ({ results }) =>
        results.ecosystem === "python"
          ? PYTHON_TS_FIELD_DEFAULTS.packageManager
          : getPackageManagerChoice(flags.packageManager),
      install: () => getinstallChoice(flags.install),
      pythonApp: ({ results }) => getPythonAppChoice(results.ecosystem, flags.pythonApp),
      pythonOrm: ({ results }) => getPythonOrmChoice(results.ecosystem, flags.pythonOrm),
      pythonMl: ({ results }) => getPythonMlChoice(results.ecosystem, flags.pythonMl),
      pythonGenai: ({ results }) => getPythonGenaiChoice(results.ecosystem, flags.pythonGenai),
      pythonAgents: ({ results }) => getPythonAgentsChoice(results.ecosystem, flags.pythonAgents),
      accelerator: ({ results }) => getAcceleratorChoice(results.ecosystem, flags.accelerator),
      pythonStarter: ({ results }) =>
        getPythonStarterChoice(results.ecosystem, flags.pythonStarter),
    },
    {
      onCancel: () => {
        throw new UserCancelledError({ message: "Operation cancelled" });
      },
    },
  );

  return {
    projectName: projectName,
    projectDir: projectDir,
    relativePath: relativePath,
    ecosystem: result.ecosystem,
    pythonApp: result.pythonApp,
    pythonOrm: result.pythonOrm,
    pythonMl: result.pythonMl,
    pythonGenai: result.pythonGenai,
    pythonAgents: result.pythonAgents,
    accelerator: result.accelerator,
    pythonStarter: result.pythonStarter,
    addonOptions: flags.addonOptions,
    dbSetupOptions: flags.dbSetupOptions,
    frontend: result.frontend,
    backend: result.backend,
    runtime: result.runtime,
    database: result.database,
    orm: result.orm,
    auth: result.auth,
    payments: result.payments,
    addons: result.addons,
    examples: result.examples,
    git: result.git,
    packageManager: result.packageManager,
    install: result.install,
    dbSetup: result.dbSetup,
    api: result.api,
    webDeploy: result.webDeploy,
    serverDeploy: result.serverDeploy,
  };
}
