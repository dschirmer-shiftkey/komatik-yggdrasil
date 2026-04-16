# Supabase Migrations — Yggdrasil World Tree

SQL migrations for the shared world tree database (project
`spsvhxldmpcdlulklqzp`). Each file is self-contained and idempotent
where possible (`IF NOT EXISTS`, `IF EXISTS`, `DROP VIEW IF EXISTS`).

## Applying a migration

Migrations are applied via the Supabase MCP tool or the Supabase
dashboard. The version tracker is Supabase's built-in migration table,
visible via `mcp__supabase__list_migrations`.

## What's committed here vs. what's applied

This directory was added in migration 005. Migrations 001-004 were
authored and applied before version-controlled SQL files existed. They
live only in Supabase's migration tracker and are recoverable via:

```
mcp__supabase__list_migrations(project_id="spsvhxldmpcdlulklqzp")
```

| Version | Name | In repo? | Purpose |
|---|---|---|---|
| 001 | world_tree_schema | no | Base tables (findings, citations, quality_reviews, sponsorships, token_usage, knowledge_events), enums, indexes, starter views |
| 002 | enable_rls | no | Row-level security + public read policies |
| 003 | fix_security_advisors | no | `security_invoker=on` on views; service-role-scoped write policies |
| 004 | rename_terminology | no | `trunk_id`→`root_id`, `branch_id`→`category_id`; enum values `seed`/`category`/`root` |
| **005** | **apex_and_public_signal** | **yes** | **Apex tier + Public Signal pipeline support** |

Backfilling 001-004 as committed SQL files is a separate open item
(not blocking 005).

## Open items in schema hygiene

- `sponsor_level` enum still has old names `seedling` and `branch` —
  migration 004 renamed findings terminology but missed sponsorships.
  Separate cleanup migration needed.
- Backfill committed SQL for migrations 001-004.

## Authoring conventions

- File name: `NNN_snake_case_name.sql`
- Match the version number with what Supabase will track it as
- Use `IF NOT EXISTS` / `IF EXISTS` where Postgres supports it, so
  migrations are re-runnable in dev environments
- Header comment block describing: what changes, why, backward
  compatibility implications
- Inline comments on non-obvious changes
- Views always use `WITH (security_invoker=on)` to respect RLS
- New event types on `knowledge_events.event_type` (free-form text, no
  enum) are documented in `docs/system-design.md`, not enforced here
