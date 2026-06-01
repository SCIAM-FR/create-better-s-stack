import { DEFAULT_STACK, isStackDefault, type StackState, TECH_OPTIONS } from "@/lib/constant";
import { stackUrlKeys } from "@/lib/stack-url-keys";

const TS_CATEGORY_ORDER: Array<keyof typeof TECH_OPTIONS> = [
  "webFrontend",
  "nativeFrontend",
  "backend",
  "runtime",
  "api",
  "database",
  "orm",
  "dbSetup",
  "webDeploy",
  "serverDeploy",
  "auth",
  "payments",
  "packageManager",
  "addons",
  "examples",
  "git",
  "install",
];

// Python mode swaps the whole TS category set for the Python one (plan Slice 11):
// the two stacks are largely disjoint. `database` is reused (SQL-only); the rest
// are the `--python-*` fields. `ecosystem` leads both so the mode switch is always
// visible.
const PYTHON_CATEGORY_ORDER: Array<keyof typeof TECH_OPTIONS> = [
  "pythonApp",
  "pythonOrm",
  "database",
  "pythonMl",
  "pythonGenai",
  "pythonAgents",
  "accelerator",
  "pythonStarter",
  "git",
  "install",
];

/**
 * The ecosystem mode switch: returns the category set for the active ecosystem,
 * always led by `ecosystem` itself so users can flip back. TS mode is unchanged
 * apart from the leading ecosystem selector.
 */
export function getCategoryOrder(ecosystem: string): Array<keyof typeof TECH_OPTIONS> {
  return ["ecosystem", ...(ecosystem === "python" ? PYTHON_CATEGORY_ORDER : TS_CATEGORY_ORDER)];
}

const CATEGORY_ORDER: Array<keyof typeof TECH_OPTIONS> = getCategoryOrder("ts");

const desktopAddonNames = {
  tauri: "Tauri",
  electrobun: "Electrobun",
} as const;

const staticDesktopFrontendNames = {
  "tanstack-start": "TanStack Start",
  next: "Next.js",
  nuxt: "Nuxt",
  svelte: "SvelteKit",
  astro: "Astro",
} as const;

export function generateStackSummary(stack: StackState) {
  const selectedTechs = getCategoryOrder(stack.ecosystem).flatMap((category) => {
    const options = TECH_OPTIONS[category];
    const selectedValue = stack[category as keyof StackState];

    if (!options) return [];

    const getTechNames = (value: string | string[]) => {
      const values = Array.isArray(value) ? value : [value];
      return values
        .filter(
          (id) =>
            id !== "none" &&
            id !== "false" &&
            !(["git", "install", "auth"].includes(category) && id === "true"),
        )
        .map((id) => options.find((opt) => opt.id === id)?.name)
        .filter(Boolean) as string[];
    };

    return selectedValue ? getTechNames(selectedValue) : [];
  });

  return selectedTechs.length > 0 ? selectedTechs.join(" • ") : "Custom stack";
}

export function getDesktopBuildNote(stack: Pick<StackState, "addons" | "webFrontend">) {
  const selectedDesktopAddons = stack.addons.filter(
    (addon): addon is keyof typeof desktopAddonNames => addon in desktopAddonNames,
  );

  if (selectedDesktopAddons.length === 0) {
    return null;
  }

  const staticFrontend = stack.webFrontend.find(
    (frontend): frontend is keyof typeof staticDesktopFrontendNames =>
      frontend in staticDesktopFrontendNames,
  );

  if (!staticFrontend) {
    return null;
  }

  const addonLabel =
    selectedDesktopAddons.length === 2
      ? "Tauri and Electrobun desktop builds"
      : `${desktopAddonNames[selectedDesktopAddons[0]]} desktop builds`;

  return `${addonLabel} package static web assets. ${staticDesktopFrontendNames[staticFrontend]} needs a static/export build configuration before desktop packaging will work.`;
}

export function generateStackCommand(stack: StackState) {
  const packageManagerCommands = {
    npm: "npx @sciam-fr/create-better-s-stack@latest",
    pnpm: "pnpm create @sciam-fr/better-s-stack@latest",
    default: "bun create @sciam-fr/better-s-stack@latest",
  };

  const base =
    packageManagerCommands[stack.packageManager as keyof typeof packageManagerCommands] ||
    packageManagerCommands.default;
  const projectName = stack.projectName || "my-better-t-app";

  // Python ecosystem command form (plan Slice 11 / §12). The scaffolder is run
  // through the same JS package-manager runner as TypeScript projects
  // (`bun create better-s-stack@latest` by default); uv is only used for the
  // generated Python project itself, never to bootstrap the CLI.
  if (stack.ecosystem === "python") {
    const picked = (arr: string[]) => arr.filter((id) => id !== "none");
    const pyFlags = [
      "--ecosystem python",
      `--python-app ${stack.pythonApp}`,
      `--python-orm ${stack.pythonOrm}`,
      `--database ${stack.database}`,
      `--accelerator ${stack.accelerator}`,
      "--package-manager uv",
    ];
    const ml = picked(stack.pythonMl);
    if (ml.length > 0) pyFlags.push(`--python-ml ${ml.join(" ")}`);
    const genai = picked(stack.pythonGenai);
    if (genai.length > 0) pyFlags.push(`--python-genai ${genai.join(" ")}`);
    const agents = picked(stack.pythonAgents);
    if (agents.length > 0) pyFlags.push(`--python-agents ${agents.join(" ")}`);
    if (stack.pythonStarter === "true") pyFlags.push("--python-starter");
    pyFlags.push(stack.git === "false" ? "--no-git" : "--git");
    pyFlags.push(stack.install === "false" ? "--no-install" : "--install");
    if (stack.yolo === "true") pyFlags.push("--yolo");
    return `${base} ${projectName} ${pyFlags.join(" ")}`;
  }

  const isStackDefaultExceptProjectName = Object.entries(DEFAULT_STACK).every(
    ([key]) =>
      key === "projectName" ||
      isStackDefault(stack, key as keyof StackState, stack[key as keyof StackState]),
  );

  if (isStackDefaultExceptProjectName) {
    return `${base} ${projectName} --yes`;
  }

  // Map web interface backend IDs to CLI backend flags
  const mapBackendToCli = (backend: string) => {
    if (
      backend === "self-next" ||
      backend === "self-tanstack-start" ||
      backend === "self-nuxt" ||
      backend === "self-svelte" ||
      backend === "self-astro"
    ) {
      return "self";
    }
    return backend;
  };

  const flags = [
    `--frontend ${
      [...stack.webFrontend, ...stack.nativeFrontend]
        .filter((v, _, arr) => v !== "none" || arr.length === 1)
        .join(" ") || "none"
    }`,
    `--backend ${mapBackendToCli(stack.backend)}`,
    `--runtime ${stack.runtime}`,
    `--api ${stack.api}`,
    `--auth ${stack.auth}`,
    `--payments ${stack.payments}`,
    `--database ${stack.database}`,
    `--orm ${stack.orm}`,
    `--db-setup ${stack.dbSetup}`,
    `--package-manager ${stack.packageManager}`,
    stack.git === "false" ? "--no-git" : "--git",
    `--web-deploy ${stack.webDeploy}`,
    `--server-deploy ${stack.serverDeploy}`,
    stack.install === "false" ? "--no-install" : "--install",
    `--addons ${
      stack.addons.length > 0
        ? stack.addons
            .filter((addon) =>
              [
                "pwa",
                "tauri",
                "electrobun",
                "starlight",
                "biome",
                "lefthook",
                "husky",
                "turborepo",
                "nx",
                "ultracite",
                "fumadocs",
                "oxlint",
                "opentui",
                "wxt",
                "skills",
                "mcp",
                "evlog",
              ].includes(addon),
            )
            .join(" ") || "none"
        : "none"
    }`,
    `--examples ${stack.examples.join(" ") || "none"}`,
  ];

  if (stack.yolo === "true") {
    flags.push("--yolo");
  }

  return `${base} ${projectName} ${flags.join(" ")}`;
}

export function generateStackUrlFromState(stack: StackState, baseUrl?: string) {
  const origin = baseUrl || "https://better-s-stack.sciam.fr";

  const stackParams = new URLSearchParams();
  Object.entries(stackUrlKeys).forEach(([stackKey, urlKey]) => {
    const value = stack[stackKey as keyof StackState];
    if (value !== undefined) {
      stackParams.set(urlKey as string, Array.isArray(value) ? value.join(",") : String(value));
    }
  });

  const searchString = stackParams.toString();
  return `${origin}/new${searchString ? `?${searchString}` : ""}`;
}

export function generateStackSharingUrl(stack: StackState, baseUrl?: string) {
  const origin = baseUrl || "https://better-s-stack.sciam.fr";

  const stackParams = new URLSearchParams();
  Object.entries(stackUrlKeys).forEach(([stackKey, urlKey]) => {
    const value = stack[stackKey as keyof StackState];
    if (value !== undefined) {
      stackParams.set(urlKey as string, Array.isArray(value) ? value.join(",") : String(value));
    }
  });

  const searchString = stackParams.toString();
  return `${origin}/stack${searchString ? `?${searchString}` : ""}`;
}

export { CATEGORY_ORDER };
