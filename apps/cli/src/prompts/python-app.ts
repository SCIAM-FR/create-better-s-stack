import type { Ecosystem, PythonApp } from "../types";

/**
 * Resolves the Python application shape. Early-returns `none` (no UI) for the
 * default `ts` ecosystem. Slice 1 is a no-op skeleton: even under `python` it
 * resolves to the flag value or `none` without prompting; the interactive
 * selection arrives with the Python shapes in later slices.
 */
export async function getPythonAppChoice(
  ecosystem: Ecosystem,
  pythonApp?: PythonApp,
): Promise<PythonApp> {
  if (ecosystem !== "python") return "none";
  return pythonApp ?? "none";
}
