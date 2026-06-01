import type { Ecosystem } from "../types";
import { UserCancelledError } from "../utils/errors";
import { isCancel, navigableSelect } from "./navigable";

/**
 * The top-level ecosystem discriminator: it leads the prompt flow so the
 * TS-vs-Python branch is the very first thing the user chooses. A provided flag
 * short-circuits the UI; otherwise an interactive select is shown. Every
 * downstream prompt is gated on the result (the TS prompts go silent under
 * `python` and the python prompts go silent under `ts`).
 */
export async function getEcosystemChoice(ecosystem?: Ecosystem): Promise<Ecosystem> {
  if (ecosystem !== undefined) return ecosystem;

  const response = await navigableSelect<Ecosystem>({
    message: "Select ecosystem",
    options: [
      {
        value: "ts" as const,
        label: "TypeScript",
        hint: "The default end-to-end type-safe TypeScript stack",
      },
      {
        value: "python" as const,
        label: "Python",
        hint: "Python apps and capability packs, installed with uv",
      },
    ],
    initialValue: "ts",
  });

  if (isCancel(response)) throw new UserCancelledError({ message: "Operation cancelled" });

  return response;
}
