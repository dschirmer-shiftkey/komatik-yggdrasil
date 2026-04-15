# Yggdrasil — Seedling Agent Collective Protocol

> Defines how the 6-agent collective operates within each Seedling.
> Every Seedling follows this protocol. Mission-specific context comes
> from the Seedling's own MISSION.md and agent configs.

## The Collective

Each Seedling runs 6 specialized agents working as a coordinated team.
No single agent has full autonomy — the collective self-regulates through
the Mission agent's oversight and the workflow engine's step dependencies.

| Role | Agent ID | Responsibility |
|------|----------|----------------|
| **Mission** | `mission` | Guardian of the MISSION.md. Evaluates every output against the mission statement. Prevents scope drift. Approves publication via structured JSON. |
| **Research** | `research` | Discovers literature, datasets, reports, and open-source projects. Synthesizes findings into structured summaries. |
| **Analysis** | `analysis` | Builds models, runs simulations, identifies patterns, quantifies impact. Turns raw research into actionable insights. |
| **Prototype** | `prototype` | Writes code, creates designs, builds proof-of-concepts. Makes ideas tangible and testable. |
| **Documentation** | `documentation` | Structures the repo, writes FINDINGS.md, ensures all outputs are readable and well-organized for public consumption. |
| **Community** | `community` | Triages external contributions (issues, PRs), acknowledges quality work, integrates community input into the research pipeline. |

## Workflow Cycle

Seedlings operate in continuous research cycles managed by the Scheduler
service. Each cycle follows this flow:

```
Research → Synthesize → Model → Prototype → Document → Mission Review → Publish
    ↑                                                                      |
    └──────────── Community contributions ←────────────────────────────────┘
```

### Cycle Steps

1. **Scheduler** creates a new workflow with 6 ordered steps
2. **Research** agent claims and executes research step
3. **Analysis** agent claims analysis step (depends on research completing)
4. **Prototype** agent builds proof-of-concepts from analysis
5. **Documentation** agent structures outputs for public readability
6. **Mission** agent reviews all outputs and returns structured approval/rejection
7. **Publisher** service commits approved outputs to the public repo
8. **Community** agent processes external contributions for next cycle

Steps have explicit dependencies — a step cannot be claimed until all its
upstream dependencies are completed. Failed steps are retried up to 2 times
by the scheduler before the workflow is marked failed. The scheduler's circuit
breaker aborts the entire workflow after 5 total step failures.

### Mission Review Gate

No output is published without Mission agent approval. The Mission agent
checks every artifact against three criteria:

1. **Alignment** — Does this advance the Seedling's stated mission?
2. **Quality** — Is this rigorous enough for public consumption?
3. **Neutrality** — Does this avoid political, commercial, or ideological bias?

The Mission agent must respond with structured JSON:

```json
{"approved": true}
```

or:

```json
{"approved": false, "reason": "Specific feedback for the originating agent"}
```

The scheduler parses this JSON block from the mission output. If no structured
block is found, it falls back to heuristic keyword matching.

## Agent Architecture

### Configuration Layers

Each agent loads three layers of context at startup:

1. **Soul file** (`souls/<role>.md`) — immutable behavioral directives for this role
2. **Mission file** (`MISSION.md`) — the Seedling's mission statement
3. **Agent YAML config** (`config/agents/<role>.yaml`) — tunable parameters:
   - `system_prompt` — domain-specific instructions prepended to the LLM system prompt
   - `preferred_model` — model passed to Bifrost (e.g., `claude-sonnet-4-20250514`)
   - `max_tokens_per_session` — per-request token ceiling
   - `task_profiles` — list of task types this agent handles

### Context Assembly

Before each step execution, the agent assembles a context window within a
configurable token budget (`config/context-budget.yaml`):

- Recent decisions (successes and failures)
- Active tasks assigned to this agent
- Unread messages from other agents
- Budget awareness (tokens spent vs. remaining)
- Previous step outputs (when step has dependencies)

### Capacity Enforcement

`config/agent-capacity.yaml` sets `max_concurrent_steps` per role. The runner
checks this before claiming work — if the agent already has the maximum number
of running steps, it waits until one completes.

### Circuit Breaker

If an agent fails 5 consecutive step executions, the circuit breaker trips and
the agent session ends with status `failed`. This prevents runaway token spend
from repeated failures.

### Decision Logging

Every step execution is logged as a decision in the `decisions` table with:
- Decision type, description, and reasoning
- Confidence score (0.0–1.0)
- Outcome tracking (pending → success/failure/superseded)
- Optional retraction with reason and attribution

## Data Access

> **Current state**: Agents connect directly to PostgreSQL for step claiming,
> decision logging, and run recording. See [ADR-001](docs/adr/001-agent-gateway-bypass.md).
>
> **Future state**: Agents will coordinate exclusively through the gateway's
> 17-tool RBAC-enforced API surface. The gateway tools already implement all
> required operations — the migration is a runner refactor, not new functionality.

### Gateway Tools (17 tools, RBAC-enforced)

The gateway exposes these tools at `POST /api/tool`:

| Tool | Description | Roles |
|------|-------------|-------|
| `register_identity` | Authenticate and create session | All |
| `create_workflow` | Create a new workflow with steps | Guardian |
| `get_workflow` | Get workflow status and step details | All |
| `advance_workflow` | Update workflow status | Guardian, Scheduler |
| `get_agent_queue` | Get pending steps for an agent | All |
| `complete_step` | Mark step completed with output | All |
| `fail_step` | Mark step failed with error | All |
| `send_agent_message` | Send message to another agent | All |
| `get_messages` | Get unread messages | All |
| `create_task` | Create a task on the kanban board | All |
| `update_task` | Update task status | All |
| `write_output` | Write a file to the output directory | All |
| `read_project_file` | Read a file from the project | All |
| `search_codebase` | Search project files by content | All |
| `get_system_health` | Get system health metrics | All |
| `get_circuit_breaker_status` | Check circuit breaker state | All |
| `reset_circuit_breaker` | Reset a tripped circuit breaker | Guardian |

## Safety Rules

- **No external API calls** except through Bifrost (LLM proxy) and Publisher (GitHub)
- **No secrets in outputs** — all published content is public
- **No political positions** — agents present evidence, not opinions
- **Budget enforcement** — Bifrost rejects requests that exceed the Seedling's budget cap
- **Circuit breaker** — 5 consecutive failures trigger hard stop; requires manual review
- **RBAC** — gateway enforces role-based tool access (deny by default for unknown agents)

## Compute Metering

Every LLM call routes through Bifrost, which tracks:

- Provider, model, and task type
- Input/output token counts
- Cost in USD
- Latency
- Which agent made the call

Usage is also recorded in the `llm_usage` PostgreSQL table for local queries.
These metrics auto-generate TOKENS.md — the public ledger of compute
donated by Komatik to this Seedling.

## File Ownership

| Path | Owner | Description |
|------|-------|-------------|
| `MISSION.md` | David (human) | Immutable — agents cannot modify |
| `AGENTS.md` | David (human) | Protocol — agents cannot modify |
| `FINDINGS.md` | `documentation` | Accumulated research findings |
| `TOKENS.md` | Publisher service | Auto-generated compute ledger |
| `RESEARCH/*` | `research` | Raw research artifacts |
| `MODELS/*` | `analysis` | Models and simulations |
| `PROTOTYPES/*` | `prototype` | Code and design PoCs |
| `config/*` | David (human) | Agent and infrastructure configs |
| `docs/adr/*` | David (human) | Architecture Decision Records |
