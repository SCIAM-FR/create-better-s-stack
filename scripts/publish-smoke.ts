#!/usr/bin/env bun
// Verify @sciam-fr/create-better-s-stack installs and runs under npm, pnpm, and
// bun. Catches any regression that breaks the published artifact for consumers —
// missing files, broken bin entry, import failures from unbundled deps, etc.
//
// The CLI bundles its internal workspace packages (@better-s-stack/*) into dist
// via tsdown, so it ships as a single self-contained package with no sibling
// workspace deps. We pack it with `npm pack` (matching the release workflow's
// `npm publish`), install the tarball in a temp dir, then run the binary to
// prove it actually executes.

import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { $ } from "bun";

const ROOT = resolve(import.meta.dir, "..");

const PKG_NAME = "@sciam-fr/create-better-s-stack";
const PKG_DIR = "apps/cli";
const BIN_NAME = "create-better-s-stack";

// Bundled workspace devDeps carry workspace: protocol refs that npm can't
// resolve. The release workflow strips them before publishing; mirror that here
// so the packed tarball matches what actually ships.
const STRIP_DEV_DEPS = ["@better-s-stack/types", "@better-s-stack/template-generator"];

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

async function pack(outDir: string): Promise<string> {
  const pkgJsonPath = join(ROOT, PKG_DIR, "package.json");
  const original = readFileSync(pkgJsonPath, "utf-8");

  const parsed = JSON.parse(original);
  if (parsed.devDependencies) {
    for (const dep of STRIP_DEV_DEPS) delete parsed.devDependencies[dep];
  }
  writeFileSync(pkgJsonPath, `${JSON.stringify(parsed, null, 2)}\n`);

  try {
    const r = await $`npm pack --pack-destination=${outDir} --json`
      .cwd(join(ROOT, PKG_DIR))
      .quiet();
    const [entry] = JSON.parse(r.stdout.toString()) as Array<{ filename: string }>;
    // npm reports the scoped filename with a slash ("@sciam-fr/create-...tgz")
    // but writes it to disk flattened ("sciam-fr-create-...tgz").
    const onDisk = entry.filename.replace(/^@/, "").replace(/\//g, "-");
    return join(outDir, onDisk);
  } finally {
    writeFileSync(pkgJsonPath, original);
  }
}

async function installAndRun(pm: "npm" | "pnpm" | "bun", tarball: string, smokeRoot: string) {
  const dir = join(smokeRoot, `install-${pm}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  // Copy the tarball in and reference it relatively. An absolute file: path to
  // a scoped tarball trips npm's extractor on Windows ("corrupted tarball");
  // a local relative ref installs cleanly on every platform.
  const localTarball = join(dir, "pkg.tgz");
  copyFileSync(tarball, localTarball);

  const fixture: Record<string, unknown> = {
    name: `smoke-${pm}`,
    private: true,
    version: "0.0.0",
    dependencies: { [PKG_NAME]: "file:./pkg.tgz" },
  };

  writeFileSync(join(dir, "package.json"), JSON.stringify(fixture, null, 2));

  const install = await $`${pm} install --ignore-scripts`.cwd(dir).quiet().nothrow();
  if (install.exitCode !== 0) {
    console.error(red(`✗ ${pm} install failed`));
    const output = `${install.stderr.toString()}${install.stdout.toString()}`.trim();
    console.error(dim(output || "(no install output)"));
    process.exit(1);
  }

  // Resolve the installed package's bin entry and run it with node directly.
  // This proves the published artifact executes end-to-end and stays
  // cross-platform — bun's $ shell can't exec the .cmd/.ps1 shims npm links on
  // Windows, and node is a real executable everywhere.
  const installedPkgDir = join(dir, "node_modules", PKG_NAME);
  const installedPkg = JSON.parse(readFileSync(join(installedPkgDir, "package.json"), "utf-8"));
  const binEntry =
    typeof installedPkg.bin === "string" ? installedPkg.bin : installedPkg.bin?.[BIN_NAME];
  if (!binEntry) {
    console.error(red(`✗ ${pm}: installed package has no '${BIN_NAME}' bin entry`));
    process.exit(1);
  }
  const run = await $`node ${join(installedPkgDir, binEntry)} --version`.cwd(dir).quiet().nothrow();
  if (run.exitCode !== 0) {
    console.error(red(`✗ ${pm}: ${BIN_NAME} --version failed (exit ${run.exitCode})`));
    console.error(dim(run.stderr.toString() + run.stdout.toString()));
    process.exit(1);
  }

  console.log(green(`✓ ${pm}`) + dim(`  v${run.stdout.toString().trim()}`));
}

async function hasPackageManager(pm: string): Promise<boolean> {
  return (await $`which ${pm}`.quiet().nothrow()).exitCode === 0;
}

const smokeRoot = join(tmpdir(), `bts-publish-smoke-${Date.now()}`);
const tarballDir = join(smokeRoot, "tarballs");
mkdirSync(tarballDir, { recursive: true });

console.log("Packing...");
const tarball = await pack(tarballDir);
console.log(dim(`  ${PKG_NAME}`));

console.log(`\nInstalling and running ${PKG_NAME} under each package manager...`);
for (const pm of ["npm", "pnpm", "bun"] as const) {
  if (!(await hasPackageManager(pm))) {
    console.log(dim(`  - ${pm} not available, skipping`));
    continue;
  }
  await installAndRun(pm, tarball, smokeRoot);
}

rmSync(smokeRoot, { recursive: true, force: true });
console.log(green("\n✓ publish smoke test passed"));
