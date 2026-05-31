import type { UrlKeys } from "nuqs";

import type { StackState } from "@/lib/constant";

export const stackUrlKeys: UrlKeys<
  Record<keyof StackState, unknown> & { viewMode: unknown; selectedFile: unknown }
> = {
  projectName: "name",
  ecosystem: "eco",
  webFrontend: "fe-w",
  nativeFrontend: "fe-n",
  runtime: "rt",
  backend: "be",
  api: "api",
  database: "db",
  orm: "orm",
  dbSetup: "dbs",
  auth: "au",
  payments: "pay",
  packageManager: "pm",
  addons: "add",
  examples: "ex",
  git: "git",
  install: "i",
  webDeploy: "wd",
  serverDeploy: "sd",
  yolo: "yolo",
  pythonApp: "pa",
  pythonOrm: "porm",
  pythonMl: "pml",
  pythonGenai: "pgen",
  pythonAgents: "pag",
  accelerator: "acc",
  pythonStarter: "pstart",
  viewMode: "view",
  selectedFile: "file",
};
