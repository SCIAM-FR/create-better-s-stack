# Slice 11 — Web Stack Builder Python support

Type: **HITL**

## What to build

Add Python support to the hand-built web **Stack Builder**. Unlike the MCP Surface (which auto-syncs from the regenerated JSON Schema), the web builder maintains its own option registry with its own id vocabulary (e.g. `self-next`), so this is manual work: add Python categories/options with their own ids, add a URL param per new Python field, and introduce an **`ecosystem` mode switch** that swaps the whole category set (TS categories ⟷ Python categories) since the two stacks are largely disjoint. Extend the Stack Builder compatibility test with the Python rules so it matches the CLI's **Compatibility Oracle**.

Marked **HITL**: it is hand-built UI with a bespoke id vocabulary and a mode-switch interaction that benefits from a design review before merge.

## Acceptance criteria

- [ ] Python categories/options added to the web option registry with their own ids
- [ ] One URL param declared per new Python field; round-trips correctly
- [ ] `ecosystem` mode switch swaps the TS ⟷ Python category sets in the UI
- [ ] Stack Builder compatibility test extended with Python rules and matches the CLI validator
- [ ] TS Stack Builder behavior unchanged in `ts` mode

## Blocked by

- Slice 1 — Ecosystem discriminator skeleton (ideally sequenced after the capability-pack slices so the full Python field set is final)
