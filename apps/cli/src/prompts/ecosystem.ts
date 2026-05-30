import type { Ecosystem } from "../types";

/**
 * Slice 1 skeleton: the ecosystem discriminator resolves silently to its flag
 * value (or the `ts` default) and shows no UI. Interactive selection — and the
 * python branch it unlocks — arrives in later slices, so the TS experience is
 * unchanged.
 */
export async function getEcosystemChoice(ecosystem?: Ecosystem): Promise<Ecosystem> {
  return ecosystem ?? "ts";
}
