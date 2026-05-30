import type { ProjectConfig } from "@better-t-stack/types";

import { toPythonPackageName } from "../core/template-processor";
import type { VirtualFileSystem } from "../core/virtual-fs";
import { GeneratorError } from "../types";
import { type TemplateData, processTemplatesFromPrefix } from "./utils";

/**
 * Routes python generation by `pythonApp`, bypassing the TS `base` pipeline
 * entirely (plan §7.1). Slice 02 implements the `library` shape; the remaining
 * shapes land in later slices and throw until then so the seam is explicit.
 */
export function processPythonTemplates(
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

  throw new GeneratorError({
    message: `Python app shape "${config.pythonApp}" is not yet implemented.`,
    phase: "python",
  });
}
