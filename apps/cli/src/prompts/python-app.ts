import type { Ecosystem, PythonApp } from "../types";
import { UserCancelledError } from "../utils/errors";
import { isCancel, navigableSelect } from "./navigable";

/**
 * Resolves the Python application shape. Returns `none` (no UI) for the default
 * `ts` ecosystem, and short-circuits to a provided flag. Under `python` with no
 * flag, an interactive select is shown.
 *
 * Only shapes the generator actually routes are offered: `flask`/`django`/`none`
 * are valid schema values but currently throw in template generation, so they are
 * intentionally omitted from the interactive picker.
 */
export async function getPythonAppChoice(
  ecosystem: Ecosystem,
  pythonApp?: PythonApp,
): Promise<PythonApp> {
  if (ecosystem !== "python") return "none";
  if (pythonApp !== undefined) return pythonApp;

  const response = await navigableSelect<PythonApp>({
    message: "Select Python app shape",
    options: [
      {
        value: "fastapi" as const,
        label: "FastAPI",
        hint: "Modern async Python API service",
      },
      {
        value: "library" as const,
        label: "Library",
        hint: "A distributable Python package",
      },
      {
        value: "streamlit" as const,
        label: "Streamlit",
        hint: "Data app where the UI is the server",
      },
      {
        value: "gradio" as const,
        label: "Gradio",
        hint: "ML demo UI where the UI is the server",
      },
      {
        value: "fasthtml" as const,
        label: "FastHTML",
        hint: "Hypermedia app where the UI is the server",
      },
      {
        value: "fastapi+streamlit" as const,
        label: "FastAPI + Streamlit",
        hint: "Two-app uv workspace (API + UI)",
      },
    ],
    initialValue: "fastapi",
  });

  if (isCancel(response)) throw new UserCancelledError({ message: "Operation cancelled" });

  return response;
}
