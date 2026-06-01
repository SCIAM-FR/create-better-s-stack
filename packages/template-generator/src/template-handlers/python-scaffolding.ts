import type { Database, ProjectConfig } from "@better-s-stack/types";

import type { VirtualFileSystem } from "../core/virtual-fs";
import { hasHeavyGenai } from "./python-deps";

/**
 * Emits the non-pyproject python capability artifacts: per-ORM database
 * scaffolding (Slice 6), a local-DB `docker-compose.yml` (Slice 6), and the
 * opt-in per-pack starters (Slice 7). These are written programmatically rather
 * than as `.hbs` templates so they need no template-codegen step.
 */

/** Where the API-side scaffolding lives: the API member dir for the workspace, root otherwise. */
function appDir(config: Partial<ProjectConfig>): string {
  return config.pythonApp === "fastapi+streamlit" ? "apps/api" : "";
}

function join(dir: string, file: string): string {
  return dir ? `${dir}/${file}` : file;
}

function databaseUrl(database: Database | undefined, async: boolean): string {
  switch (database) {
    case "postgres":
      return async
        ? "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
        : "postgresql+psycopg://postgres:postgres@localhost:5432/app";
    case "mysql":
      return async
        ? "mysql+aiomysql://root:root@localhost:3306/app"
        : "mysql+pymysql://root:root@localhost:3306/app";
    default:
      return async ? "sqlite+aiosqlite:///./app.db" : "sqlite:///./app.db";
  }
}

function sqlalchemyDb(database: Database | undefined): string {
  return `import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "${databaseUrl(database, false)}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
`;
}

function sqlmodelDb(database: Database | undefined): string {
  return `import os

from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = os.environ.get("DATABASE_URL", "${databaseUrl(database, false)}")

engine = create_engine(DATABASE_URL)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
`;
}

function tortoiseDb(database: Database | undefined): string {
  return `import os

from tortoise import Tortoise

DATABASE_URL = os.environ.get("DATABASE_URL", "${databaseUrl(database, true)}")

TORTOISE_ORM = {
    "connections": {"default": DATABASE_URL},
    "apps": {
        "models": {
            "models": ["models"],
            "default_connection": "default",
        }
    },
}


async def init_db() -> None:
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
`;
}

export function emitOrmScaffolding(vfs: VirtualFileSystem, config: Partial<ProjectConfig>): void {
  const orm = config.pythonOrm;
  if (!orm || orm === "none") return;

  const dir = appDir(config);
  if (orm === "sqlalchemy") vfs.writeFile(join(dir, "db.py"), sqlalchemyDb(config.database));
  else if (orm === "sqlmodel") vfs.writeFile(join(dir, "db.py"), sqlmodelDb(config.database));
  else if (orm === "tortoise") vfs.writeFile(join(dir, "db.py"), tortoiseDb(config.database));
}

export function emitDockerCompose(vfs: VirtualFileSystem, config: Partial<ProjectConfig>): void {
  const db = config.database;
  // sqlite is file-based and needs no container; only server databases get a compose file.
  if (db === "postgres") {
    vfs.writeFile(
      "docker-compose.yml",
      `services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
`,
    );
  } else if (db === "mysql") {
    vfs.writeFile(
      "docker-compose.yml",
      `services:
  db:
    image: mysql:8
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: app
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
`,
    );
  }
}

const TRAIN_STARTER = `"""Opt-in training starter scaffolded by Better-S-Stack.

Run with: uv run --extra train python train.py
"""


def main() -> None:
    print("Set up your training loop here.")


if __name__ == "__main__":
    main()
`;

const SERVE_STARTER = `"""Opt-in vLLM serving starter scaffolded by Better-S-Stack.

Run with: uv run --extra serve python serve.py
"""

from vllm import LLM, SamplingParams


def main() -> None:
    llm = LLM(model="facebook/opt-125m")
    params = SamplingParams(temperature=0.7)
    for output in llm.generate(["Hello, world!"], params):
        print(output.outputs[0].text)


if __name__ == "__main__":
    main()
`;

const ML_TRAIN_STARTER = `"""Opt-in ML training starter scaffolded by Better-S-Stack.

Run with: uv run --extra ml python train.py
"""


def main() -> None:
    print("Load your dataset and fit a model here.")


if __name__ == "__main__":
    main()
`;

function agentStarter(framework: string): string {
  return `"""Opt-in agent-loop starter scaffolded by Better-S-Stack.

Built for: ${framework}
Run with: uv run --extra agents python agent.py
"""


def main() -> None:
    print("Wire up your ${framework} agent loop here.")


if __name__ == "__main__":
    main()
`;
}

/**
 * Opt-in per-pack starters, gated on the parallel `pythonStarter` boolean
 * (never an `examples` value). vllm → a serving entrypoint; heavy train picks →
 * `train.py`; otherwise an ML `train.py` for the torch/ML packs.
 */
export function emitStarters(vfs: VirtualFileSystem, config: Partial<ProjectConfig>): void {
  if (!config.pythonStarter) return;

  const genai = config.pythonGenai ?? [];
  const ml = config.pythonMl ?? [];
  const agents = config.pythonAgents ?? [];

  if (genai.includes("vllm")) {
    vfs.writeFile("serve.py", SERVE_STARTER);
  }

  const hasTrainPack = genai.some((p) =>
    ["unsloth", "trl", "peft", "transformers", "accelerate"].includes(p),
  );
  if (hasTrainPack || hasHeavyGenai(config)) {
    vfs.writeFile("train.py", TRAIN_STARTER);
  } else if (ml.length > 0) {
    vfs.writeFile("train.py", ML_TRAIN_STARTER);
  }

  // Agents pack (Slice 9): an agent-loop starter for the selected framework.
  if (agents.length > 0) {
    vfs.writeFile("agent.py", agentStarter(agents[0]));
  }
}
