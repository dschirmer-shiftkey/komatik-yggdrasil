# ADR-001: Agents Bypass Gateway for Database Access

**Status**: Accepted (temporary)
**Date**: 2026-04-15

## Context

AGENTS.md specifies that all agent coordination flows through the gateway's
17-tool MCP surface. In practice, `runner.js` connects directly to PostgreSQL
to claim steps, log decisions, and record runs.

The gateway tools exist and are RBAC-enforced, but the runner does not call
them because:

1. The gateway was built after the runner, and retrofitting requires rewriting
   the runner's entire data layer to use HTTP calls instead of SQL.
2. Direct DB access is lower latency and simpler for the initial prototype.
3. The RBAC layer adds no value when there is only one trust boundary (all
   containers share the same Docker network and DB credentials).

## Decision

Agents connect directly to PostgreSQL on `backend-net`. The gateway serves as
the RBAC-enforced API for external or future multi-tenant access.

## Consequences

- **Pro**: Simpler runner code, lower latency, fewer failure modes.
- **Con**: AGENTS.md description is aspirational, not actual. RBAC is not
  enforced on agent DB operations.
- **Migration path**: When multi-tenancy or external agent federation is
  needed, swap `runner.js` DB calls for gateway HTTP calls. The gateway tools
  already implement the same operations with RBAC enforcement.
