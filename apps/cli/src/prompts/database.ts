import { DEFAULT_CONFIG } from "../constants";
import type { Backend, Database, Runtime } from "../types";
import { UserCancelledError } from "../utils/errors";
import { isCancel, navigableSelect } from "./navigable";

export async function getDatabaseChoice(database?: Database, backend?: Backend, runtime?: Runtime) {
  if (backend === "convex" || backend === "none") {
    return "none";
  }

  if (database !== undefined) return database;

  const databaseOptions: Array<{
    value: Database;
    label: string;
    hint: string;
  }> = [
    {
      value: "none",
      label: "None",
      hint: "No database setup",
    },
    {
      value: "sqlite",
      label: "SQLite",
      hint: "lightweight, server-less, embedded relational database",
    },
    {
      value: "postgres",
      label: "PostgreSQL",
      hint: "powerful, open source object-relational database system",
    },
    {
      value: "mysql",
      label: "MySQL",
      hint: "popular open-source relational database system",
    },
  ];

  if (runtime !== "workers") {
    databaseOptions.push({
      value: "mongodb",
      label: "MongoDB",
      hint: "open-source NoSQL database that stores data in JSON-like documents called BSON",
    });
  }

  const response = await navigableSelect<Database>({
    message: "Select database",
    options: databaseOptions,
    initialValue: DEFAULT_CONFIG.database,
  });

  if (isCancel(response)) throw new UserCancelledError({ message: "Operation cancelled" });

  return response;
}

/**
 * Database picker for the python ecosystem. SQL-only — MongoDB is unsupported for
 * python in v1 (validatePythonConstraints) — and defaults to `none` (no DB), so a
 * python project carries no data layer unless the user opts in. A provided flag
 * short-circuits the UI.
 */
export async function getPythonDatabaseChoice(database?: Database): Promise<Database> {
  if (database !== undefined) return database;

  const response = await navigableSelect<Database>({
    message: "Select database",
    options: [
      { value: "none", label: "None", hint: "No database" },
      { value: "sqlite", label: "SQLite", hint: "File-based SQL database" },
      { value: "postgres", label: "PostgreSQL", hint: "Advanced SQL database" },
      { value: "mysql", label: "MySQL", hint: "Popular relational database" },
    ],
    initialValue: "none",
  });

  if (isCancel(response)) throw new UserCancelledError({ message: "Operation cancelled" });

  return response;
}
