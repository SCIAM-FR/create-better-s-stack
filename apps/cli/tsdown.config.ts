import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts", "src/virtual.ts"],
  format: ["esm"],
  clean: true,
  shims: true,
  outDir: "dist",
  dts: true,
  // Bundle the internal workspace packages into the published artifact. GitHub
  // Packages requires every published scope to match the repo owner (@sciam-fr),
  // so @better-s-stack/* can't be published there — instead they ship inlined
  // and the CLI publishes as a single self-contained private package.
  noExternal: [/^@better-s-stack\//],
  outputOptions: {
    banner: "#!/usr/bin/env node",
  },
  env: {
    BTS_TELEMETRY: process.env.BTS_TELEMETRY || "0",
    CONVEX_INGEST_URL: process.env.CONVEX_INGEST_URL || "",
  },
});
