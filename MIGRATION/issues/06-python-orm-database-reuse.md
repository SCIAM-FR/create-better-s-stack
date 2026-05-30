# Slice 6 — `pythonOrm` + database reuse (SQL only)

Type: **AFK**

## What to build

Let Python **Project Configurations** carry a real database by _reusing_ the existing `database` enum and adding the parallel `pythonOrm` field (`sqlalchemy` / `sqlmodel` / `tortoise` / `none`). Emit ORM scaffolding per `pythonOrm` into the generated project. SQL-only in v1: `mongodb` is excluded and `dbSetup` is forced `none` (both already enforced by `validatePythonConstraints`). When `database !== "none"`, optionally emit a `docker-compose.yml` for a local DB.

## Acceptance criteria

- [ ] `pythonOrm` select threads through prompts/silent path; TS `orm` stays `none` for Python configs
- [ ] Each `pythonOrm` value emits correct scaffolding; `database` is honored (sqlite/postgres/mysql), mongodb rejected
- [ ] Optional `docker-compose.yml` emitted when `database !== "none"`
- [ ] `uv sync` succeeds with the ORM dependency present; ORM × (db on/off) covered representatively in the **Default Suite**
- [ ] TS regression guards remain green; `bun run check` clean

## Blocked by

- Slice 2 — First Python project: `library` shape
