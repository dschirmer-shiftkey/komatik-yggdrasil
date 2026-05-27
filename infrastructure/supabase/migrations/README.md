# Supabase Migrations — Cairn World Tree

SQL migrations for the **dedicated Cairn Supabase project** (shared knowledge
layer). Per-seed operational data stays in each seed's local PostgreSQL.

## Greenfield setup (2026-05+)

The retired Yggdrasil Supabase project (`spsvhxldmpcdlulklqzp`) is **not**
used. Provision a new project (name: `cairn`) and apply:

| File | Purpose |
|------|---------|
| `001_cairn_world_tree_schema.sql` | Full world-tree schema (findings, events, citations, reviews, sponsorships, token_usage, contention_map, RLS) |

`005_apex_and_public_signal.sql` is kept for historical reference only — its
changes are already included in `001`.

### Apply via Supabase MCP

```text
apply_migration(project_id="<cairn-project-ref>", name="cairn_world_tree_schema", query=<contents of 001>)
```

Or paste `001_cairn_world_tree_schema.sql` into the Supabase SQL editor.

### Wire the repo

```bash
cp infrastructure/.env.example infrastructure/.env
# Set SUPABASE_URL=https://<ref>.supabase.co
# Set SUPABASE_SERVICE_ROLE_KEY from Project Settings → API
```

Preflight: `bash infrastructure/scripts/preflight-seed-dry-run.sh`

## Authoring conventions

- File name: `NNN_snake_case_name.sql`
- Use `IF NOT EXISTS` / `IF EXISTS` where Postgres supports it
- Views use `WITH (security_invoker = on)`
- `knowledge_events.event_type` is free-form text (documented in `docs/system-design.md`)
