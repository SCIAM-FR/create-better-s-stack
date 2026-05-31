import { describe, expect, it } from "bun:test";

import { createVirtual } from "../src/index";
import { collectFiles } from "./setup";

type Overrides = Parameters<typeof createVirtual>[0];

// A python project that reuses the existing `database` enum and carries a real
// Python ORM via the parallel `pythonOrm` field (Slice 6). SQL-only in v1.
function pythonOrm(overrides: Overrides = {}) {
  return createVirtual({
    projectName: "py-orm",
    ecosystem: "python",
    pythonApp: "fastapi",
    packageManager: "uv",
    backend: "none",
    api: "none",
    orm: "none",
    runtime: "none",
    frontend: [],
    auth: "none",
    payments: "none",
    database: "none",
    dbSetup: "none",
    webDeploy: "none",
    serverDeploy: "none",
    addons: [],
    examples: [],
    ...overrides,
  });
}

async function ormFiles(overrides: Overrides = {}) {
  const result = await pythonOrm(overrides);
  if (result.isErr()) throw result.error;
  return collectFiles(result.value.root, result.value.root.path);
}

describe("python ORM dependency + database reuse", () => {
  it("adds the SQLAlchemy dependency and its postgres driver, honoring the database", async () => {
    const files = await ormFiles({ pythonOrm: "sqlalchemy", database: "postgres" });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("sqlalchemy>=2.0");
    expect(pyproject).toContain("psycopg[binary]");
  });

  it("adds the SQLModel dependency for a sqlite project with no server driver", async () => {
    const files = await ormFiles({ pythonOrm: "sqlmodel", database: "sqlite" });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("sqlmodel>=0.0.21");
    expect(pyproject).not.toContain("psycopg");
    expect(pyproject).not.toContain("pymysql");
  });

  it("adds Tortoise with its async mysql driver", async () => {
    const files = await ormFiles({ pythonOrm: "tortoise", database: "mysql" });
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).toContain("tortoise-orm>=0.21");
    expect(pyproject).toContain("aiomysql");
  });

  it("emits ORM database scaffolding (db.py)", async () => {
    const files = await ormFiles({ pythonOrm: "sqlalchemy", database: "sqlite" });
    const db = files.get("db.py") ?? "";
    expect(db).toContain("create_engine");
    expect(db).toContain("DeclarativeBase");
  });

  it("emits no scaffolding and no ORM deps when pythonOrm is none", async () => {
    const files = await ormFiles({ pythonOrm: "none", database: "none" });
    expect(files.has("db.py")).toBe(false);
    const pyproject = files.get("pyproject.toml") ?? "";
    expect(pyproject).not.toContain("sqlalchemy");
  });

  it("emits a local-DB docker-compose.yml for a server database", async () => {
    const files = await ormFiles({ pythonOrm: "sqlalchemy", database: "postgres" });
    const compose = files.get("docker-compose.yml") ?? "";
    expect(compose).toContain("postgres:16");
    expect(compose).toContain("5432:5432");
  });

  it("emits no docker-compose.yml for a file-based sqlite database", async () => {
    const files = await ormFiles({ pythonOrm: "sqlalchemy", database: "sqlite" });
    expect(files.has("docker-compose.yml")).toBe(false);
  });

  it("rejects mongodb for the python ecosystem (SQL-only in v1)", async () => {
    const result = await pythonOrm({ pythonOrm: "sqlalchemy", database: "mongodb" });
    expect(result.isErr()).toBe(true);
  });
});
