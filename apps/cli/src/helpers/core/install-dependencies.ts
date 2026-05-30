import { Result } from "better-result";
import { $ } from "execa";
import pc from "picocolors";

import type { Addons, Ecosystem, PackageManager } from "../../types";
import { ProjectCreationError } from "../../utils/errors";
import { shouldSkipExternalCommands } from "../../utils/external-commands";
import { createSpinner } from "../../utils/terminal-output";

/**
 * Resolves the install command from the ecosystem (plan §8): python uses
 * `uv sync` (with `--extra` per selected capability pack), TS uses the chosen
 * package manager's `install`. Pure so it can be unit-tested without spawning.
 */
export function resolveInstallCommand({
  ecosystem,
  packageManager,
  extras = [],
}: {
  ecosystem: Ecosystem;
  packageManager: PackageManager;
  extras?: string[];
}): { command: string; args: string[] } {
  if (ecosystem === "python") {
    return { command: "uv", args: ["sync", ...extras.flatMap((extra) => ["--extra", extra])] };
  }
  return { command: packageManager, args: ["install"] };
}

export async function installDependencies({
  projectDir,
  packageManager,
  ecosystem = "ts",
  extras = [],
}: {
  projectDir: string;
  packageManager: PackageManager;
  ecosystem?: Ecosystem;
  extras?: string[];
  addons?: Addons[];
}): Promise<Result<void, ProjectCreationError>> {
  if (shouldSkipExternalCommands()) {
    return Result.ok(undefined);
  }

  const { command, args } = resolveInstallCommand({ ecosystem, packageManager, extras });

  const s = createSpinner();

  s.start(`Running ${command} ${args.join(" ")}...`);

  const result = await Result.tryPromise({
    try: async () => {
      await $({
        cwd: projectDir,
        stderr: "inherit",
      })`${command} ${args}`;
    },
    catch: (e) =>
      new ProjectCreationError({
        phase: "dependency-installation",
        message: `Installation error: ${e instanceof Error ? e.message : String(e)}`,
        cause: e,
      }),
  });

  if (result.isOk()) {
    s.stop("Dependencies installed successfully");
  } else {
    s.stop(pc.red("Failed to install dependencies"));
  }

  return result;
}
