import type { ProjectConfig } from "@better-s-stack/types";

import { toPythonPackageName } from "../core/template-processor";
import type { VirtualFileSystem } from "../core/virtual-fs";
import { GeneratorError } from "../types";
import { processPythonDeploy } from "./python-deploy";
import { processPythonPyproject } from "./python-deps";
import { emitDockerCompose, emitOrmScaffolding, emitStarters } from "./python-scaffolding";
import { type TemplateData, processTemplatesFromPrefix } from "./utils";

/**
 * Routes python generation by `pythonApp`, bypassing the TS `base` pipeline
 * entirely (plan §7.1), then layers the cross-cutting capability artifacts
 * (ORM + database, ML/GenAI/Agents packs, accelerator wiring, starters) that
 * are independent of the chosen shape.
 */
export function processPythonTemplates(
  vfs: VirtualFileSystem,
  templates: TemplateData,
  config: ProjectConfig,
): void {
  routePythonShape(vfs, templates, config);

  // Cross-cutting capability layering (Slices 6–8): thread ORM deps, pack
  // extras, accelerator wiring, requires-python and conflicts into the generated
  // pyproject, then emit ORM scaffolding, a local-DB compose file and opt-in
  // starters. Each is a no-op when the corresponding fields are inert.
  processPythonPyproject(vfs, config);
  emitOrmScaffolding(vfs, config);
  emitDockerCompose(vfs, config);
  emitStarters(vfs, config);
  processPythonDeploy(vfs, config);
}

/**
 * Routes by `pythonApp` to the per-shape templates. Throws for an unimplemented
 * shape so the seam stays explicit.
 */
function routePythonShape(
  vfs: VirtualFileSystem,
  templates: TemplateData,
  config: ProjectConfig,
): void {
  if (config.pythonApp === "library") {
    processTemplatesFromPrefix(vfs, templates, "python/library", "", config);

    // The source package directory is named from the project; template
    // filenames are not Handlebars-processed, so it is written here.
    const pkg = toPythonPackageName(config.projectName);
    vfs.writeFile(`src/${pkg}/__init__.py`, '__version__ = "0.1.0"\n');
    return;
  }

  if (config.pythonApp === "fastapi") {
    // A sole fastapi app is a flat-root project (plan §261): pyproject + the
    // `main.py` entrypoint + tests at the root, `uv sync` at the root. The
    // `apps/api` workspace layout is reserved for `fastapi+streamlit` (Slice 5).
    processTemplatesFromPrefix(vfs, templates, "python/fastapi", "", config);
    return;
  }

  // Python-native fullstack shapes (Slice 04): the UI *is* the server, mapping
  // onto the TS `self` (fullstack) concept — one runnable process that is both
  // UI and server. Each is a flat-root single app (templates routed to `.`),
  // exactly like `fastapi`; the separate-backend question is already suppressed
  // for any python ecosystem upstream (the ecosystem gate in the prompt flow).
  if (
    config.pythonApp === "streamlit" ||
    config.pythonApp === "gradio" ||
    config.pythonApp === "fasthtml"
  ) {
    processTemplatesFromPrefix(vfs, templates, `python/${config.pythonApp}`, "", config);
    return;
  }

  if (config.pythonApp === "fastapi+streamlit") {
    // Two-app uv workspace (plan §261): a FastAPI API in apps/api and a
    // Streamlit UI in apps/app, reusing the single-app code from the fastapi
    // and streamlit prefixes. The workspace tree is laid down last so its root
    // pyproject (members = ["apps/*"]) is added and each member's pyproject is
    // overridden with a workspace-member variant — members need distinct,
    // installable package names so one root `uv sync` builds and installs both
    // apps into a single shared environment with one root lock.
    processTemplatesFromPrefix(vfs, templates, "python/fastapi", "apps/api", config);
    processTemplatesFromPrefix(vfs, templates, "python/streamlit", "apps/app", config);
    processTemplatesFromPrefix(vfs, templates, "python/fastapi+streamlit", "", config);
    return;
  }

  throw new GeneratorError({
    message: `Python app shape "${config.pythonApp}" is not yet implemented.`,
    phase: "python",
  });
}
