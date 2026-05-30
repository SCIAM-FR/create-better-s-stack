import type {
  Accelerator,
  Ecosystem,
  PythonAgents,
  PythonGenai,
  PythonMl,
  PythonOrm,
} from "../types";

/**
 * Python capability prompts (ORM, ML / GenAI / Agents packs, accelerator, and
 * the opt-in starter). Slice 1 is a no-op skeleton: each resolves to its flag
 * value or inert default and shows no UI, gated on `ecosystem === "python"`.
 * The interactive multi-selects arrive with the capability packs in later
 * slices.
 */

export async function getPythonOrmChoice(
  ecosystem: Ecosystem,
  pythonOrm?: PythonOrm,
): Promise<PythonOrm> {
  if (ecosystem !== "python") return "none";
  return pythonOrm ?? "none";
}

export async function getPythonMlChoice(
  ecosystem: Ecosystem,
  pythonMl?: PythonMl[],
): Promise<PythonMl[]> {
  if (ecosystem !== "python") return [];
  return pythonMl ?? [];
}

export async function getPythonGenaiChoice(
  ecosystem: Ecosystem,
  pythonGenai?: PythonGenai[],
): Promise<PythonGenai[]> {
  if (ecosystem !== "python") return [];
  return pythonGenai ?? [];
}

export async function getPythonAgentsChoice(
  ecosystem: Ecosystem,
  pythonAgents?: PythonAgents[],
): Promise<PythonAgents[]> {
  if (ecosystem !== "python") return [];
  return pythonAgents ?? [];
}

export async function getAcceleratorChoice(
  ecosystem: Ecosystem,
  accelerator?: Accelerator,
): Promise<Accelerator> {
  if (ecosystem !== "python") return "cpu";
  return accelerator ?? "cpu";
}

export async function getPythonStarterChoice(
  ecosystem: Ecosystem,
  pythonStarter?: boolean,
): Promise<boolean> {
  if (ecosystem !== "python") return false;
  return pythonStarter ?? false;
}
