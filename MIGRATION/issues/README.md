# Polyglot Python Ecosystem — Issue Slices

Vertical-slice (tracer-bullet) breakdown of `MIGRATION/02-implementation-extension-plan.md`.
Each slice cuts end-to-end through schema → config construction → validation → generation → install → tests.

Governing principle: `ecosystem: "ts"` stays a complete no-op; every Python branch is additive.

| #   | Slice                                                         | Type     | Blocked by       |
| --- | ------------------------------------------------------------- | -------- | ---------------- |
| 01  | Ecosystem discriminator skeleton (no-op)                      | AFK      | —                |
| 02  | First Python project: `library` shape generates + installs    | AFK      | 01               |
| 03  | `fastapi` API service shape                                   | AFK      | 02               |
| 04  | Python-native fullstack frontends (streamlit/gradio/fasthtml) | AFK      | 02               |
| 05  | `fastapi+streamlit` uv workspace                              | AFK      | 03, 04           |
| 06  | `pythonOrm` + database reuse (SQL only)                       | AFK      | 02               |
| 07  | ML capability pack + accelerator wiring                       | AFK      | 02               |
| 08  | GenAI capability pack (light + heavy + conflicts)             | AFK      | 07               |
| 09  | Agents capability pack                                        | AFK      | 07               |
| 10  | Python Docker deploy                                          | AFK      | 08               |
| 11  | Web Stack Builder Python support                              | **HITL** | 01 (after packs) |
| 12  | Docs: polyglot capability                                     | AFK      | 02               |

## Dependency graph

```
01 ─┬─ 02 ─┬─ 03 ─┐
    │      │      ├─ 05
    │      ├─ 04 ─┘
    │      ├─ 06
    │      ├─ 07 ─┬─ 08 ─ 10
    │      │      └─ 09
    │      └─ 12
    └─ 11 (sequence after 07–10 so the Python field set is final)
```

## Recommended build order

`01 → 02 → {03, 04, 06, 07} → {05, 08, 09} → 10 → 11 → 12`

Maps to the plan's phases: 01 = Phase 0; 02–03 = Phase 1; 04–06 = Phase 2; 07–09 = Phase 3; 10–12 = Phase 4.
