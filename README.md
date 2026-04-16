# Komatik Yggdrasil — The Charitable AI Initiative

> Autonomous agent collectives working on global problems in public.
> Every output open-source. Powered by Komatik compute.

## What Is Yggdrasil?

Yggdrasil is a collection of **Seeds** — self-contained AI agent collectives,
each assigned to a single global mission. The agents research, reason, model, and
prototype continuously. Every output is committed to a public repository under
open-source licenses.

Yggdrasil is not a product for sale. It is a living demonstration of what
autonomous AI agents can accomplish when the profit motive is removed and the
only directive is the mission.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/dschirmer-shiftkey/komatik-yggdrasil.git
cd komatik-yggdrasil

# Configure environment
cp .env.example .env
# Edit .env — fill in POSTGRES_PASSWORD, at least one LLM API key, GITHUB_TOKEN

# Boot a Seed (Energy)
docker compose --project-directory . \
  -f infrastructure/compose.yaml \
  -f seeds/001-energy/config/compose.override.yaml up
```

### Running Tests

```bash
cd infrastructure/agent  && npm ci && npm test   # 5 tests — context assembler, decisions
cd infrastructure/gateway && npm ci && npm test   # 25 tests — RBAC, tool registry
```

## How It Works

Each Seed is a containerized stack running:

- **6 specialized agents** — Mission, Research, Analysis, Prototype, Documentation, Community
- **OpenClaw Gateway** — RBAC-enforced tool surface (17 tools), health checks, migration runner
- **Bifrost AI Gateway** — LLM proxy with per-Seed cost metering and budget enforcement
- **Scheduler** — cycle loop manager with step retry (2x) and circuit breaker (5 failures)
- **PostgreSQL** — agent state, decisions, workflow steps, memory, and LLM usage telemetry
- **Publisher** — validates artifacts, commits approved outputs to this repo, generates TOKENS.md

### Agent Loop

Each agent runs a continuous loop:

1. Load soul (behavioral directives), mission, and YAML config (system prompt, preferred model, token limits)
2. Assemble context (recent decisions, memories, tasks, budget awareness) within a configurable token budget
3. Claim the next pending workflow step (atomic `SELECT FOR UPDATE SKIP LOCKED`)
4. Execute via Bifrost → write artifact → log decision → record LLM usage (all in a DB transaction)
5. Refresh context and repeat — circuit breaker trips after 5 consecutive failures

### Research Cycle

```
Scheduler creates workflow
    ↓
Research → Analysis → Prototype → Documentation → Mission Review
    ↑                                                      |
    └──────────── Community contributions ←────────────────┘
                                                           ↓
                              Publisher commits approved outputs to GitHub
```

Failed steps are retried up to 2 times before the workflow is marked failed.
The scheduler's circuit breaker aborts a workflow after 5 total step failures.

### Mission Review Gate

The Mission agent reviews all outputs and responds with structured approval:

```json
{"approved": true}
```

or rejection with reason:

```json
{"approved": false, "reason": "Designs assume grid-connected inverter availability"}
```

Only approved outputs are published. The scheduler parses this JSON to signal the publisher.

All LLM calls are metered. Every token spent is logged in each Seed's
`TOKENS.md` — a public ledger of compute donated by Komatik.

## The World Tree

Yggdrasil organizes all of its work into a hierarchy:
- **Roots** — broad categories of human need
- **Categories** — specific problem domains within a root
- **Seeds** — geographically scoped instances, independently funded

Seeds in the same category share knowledge upward. Sponsors fund specific
seeds. See [tree.yaml](tree.yaml) for the machine-readable registry.

### Basic Needs

| Category | Seeds | Status |
|--------|-----------|--------|
| **Energy** — Distributed renewables, open hardware, community microgrids | [001-energy](seeds/001-energy/) (Sub-Saharan Africa & SE Asia) | Infrastructure Ready |
| **Housing** — Homelessness reduction, affordable housing research | [002-homelessness-la](seeds/002-homelessness-la/) (Los Angeles County) | Planned |
| **Hunger** — Food insecurity, food loss, smallholder agriculture | *Open for proposals* | — |
| **Water** — Purification, collection, sanitation systems | *Open for proposals* | — |
| **Health** — Physical and behavioral health, mental health, addiction, elder care | *Open for proposals* | — |

### Human Growth

| Category | Seeds | Status |
|--------|-----------|--------|
| **Education** — Learning tools, literacy, vocational training | *Open for proposals* | — |
| **Economic Opportunity** — Poverty reduction, microfinance, job creation | *Open for proposals* | — |
| **Equality** — Gender, racial, and disability equity research | *Open for proposals* | — |

### Planet & Life

| Category | Seeds | Status |
|--------|-----------|--------|
| **Climate** — Carbon sequestration, adaptation, disaster resilience, early warning | *Open for proposals* | — |
| **Oceans** — Marine conservation, plastic pollution, fisheries | *Open for proposals* | — |
| **Ecosystems** — Biodiversity, reforestation, soil health, wildlife | *Open for proposals* | — |

### Society & Systems

| Category | Seeds | Status |
|--------|-----------|--------|
| **Peace** — Conflict resolution, refugee support, governance | *Open for proposals* | — |
| **Community** — Civic life, arts, culture, animal welfare, disaster prep, transit, urban planning | *Open for proposals* | — |
| **Digital Access** — Digital divide, connectivity, open knowledge | *Open for proposals* | — |

### Proposing a New Seed

Anyone can propose a new seed by opening a GitHub issue. Each category defines
a **scope floor** — the minimum geographic granularity for a seed. Below that
level, contributors join an existing seed rather than creating a new one.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the full proposal process.

## The Pledge

Komatik pledges **1% of platform compute** to Yggdrasil Seeds. As the
platform grows, so does the charitable compute budget. Every token is tracked,
every output is public, every finding is open-source.

| Phase | Trigger | Action |
|-------|---------|--------|
| Phase 1 | Pre-revenue | Flat monthly budget per Seed |
| Phase 2 | First consistent revenue | Open Donor-Advised Fund (DAF) |
| Phase 3 | Sufficient scale | Graduate to 501(c)(3) foundation |

## Repository Structure

```
komatik-yggdrasil/
├── infrastructure/           # Container specs and shared configs
│   ├── compose.yaml          # Template Docker Compose for a Seed
│   ├── .env.example          # Environment template (copy to root .env)
│   ├── gateway/              # OpenClaw Gateway — RBAC, 17 tools, migrations
│   │   ├── Dockerfile        # Node 22 Alpine image
│   │   ├── server.js         # HTTP server with /health, /api/tool, /api/tools
│   │   ├── tools.js          # 17 tool handler implementations
│   │   ├── rbac.js           # Role-based access control engine
│   │   ├── migrate.js        # Checksummed transactional migration runner
│   │   ├── schema.sql        # Base schema (10 tables)
│   │   ├── migrations/       # Incremental SQL migrations
│   │   └── test/             # RBAC + tool registry unit tests
│   ├── agent/                # Agent runner image
│   │   ├── Dockerfile        # Node 22 Alpine image
│   │   ├── runner.js         # Main agent loop — claim, execute, record
│   │   ├── lib/              # Context assembler, decisions module
│   │   ├── souls/            # 6 role-specific behavioral directives
│   │   └── test/             # Context assembler + decisions unit tests
│   ├── publisher/            # Git output pipeline + TOKENS.md generator
│   │   ├── Dockerfile        # Node 22 Alpine + git
│   │   └── index.js          # Artifact validation, secret scan, git push
│   ├── scheduler/            # Cycle loop manager with retry + circuit breaker
│   │   ├── Dockerfile        # Node 22 Alpine image
│   │   └── index.js          # Workflow creation, step retry, circuit breaker
│   ├── bifrost/              # Custom Bifrost AI Gateway
│   │   ├── Dockerfile        # Extends maximhq/bifrost
│   │   ├── config.template.json  # LLM provider config template
│   │   └── entrypoint.sh     # Runtime env var substitution
│   └── config/               # Shared operational configs
│       ├── rbac-policies.yaml    # Role → tool authorization matrix
│       ├── agent-capacity.yaml   # Max concurrent steps per role
│       └── context-budget.yaml   # Token budget per context section
├── categories/               # Shared knowledge per problem domain
│   ├── energy/               # Cross-seed findings for energy
│   └── housing/              # Cross-seed findings for housing
├── tree.yaml                 # Category & Seed registry (website consumes this)
├── seeds/
│   ├── 001-energy/           # Energy — Sub-Saharan Africa & SE Asia
│   └── 002-homelessness-la/  # Homelessness — Los Angeles County
│       ├── MISSION.md        # Immutable mission statement
│       ├── AGENTS.md         # Seed-specific agent protocol
│       ├── TOKENS.md         # Public compute ledger (auto-updated)
│       ├── FINDINGS.md       # Accumulated research findings
│       ├── RESEARCH/         # Raw research artifacts
│       ├── MODELS/           # Data models and simulations
│       ├── PROTOTYPES/       # Code and design proof-of-concepts
│       └── config/           # Overrides for this Seed
│           ├── agents/*.yaml # 6 agent configs (system prompts, models, limits)
│           ├── bifrost.json  # LLM provider config ($50/month budget)
│           └── compose.override.yaml  # Mounts configs into base containers
├── docs/
│   └── adr/                  # Architecture Decision Records
│       └── 001-agent-gateway-bypass.md
├── .github/workflows/        # CI pipeline
│   └── validate.yml          # Structure validation, Docker builds, tests
├── .env.example              # Root-level env template (copy to .env)
├── AGENTS.md                 # Seed agent collective protocol
├── CONTRIBUTING.md           # How to participate
├── LICENSE                   # MIT (code)
└── LICENSE-CC-BY-4.0         # CC BY 4.0 (research/findings)
```

## Licensing

- **Code and implementations**: [MIT License](LICENSE)
- **Research, findings, and documentation**: [CC BY 4.0](LICENSE-CC-BY-4.0)
- **Komatik brand assets**: All rights reserved

## Part of the Komatik Ecosystem

Yggdrasil is built on [Komatik](https://komatik.ai)'s agent infrastructure —
the same OpenClaw orchestration engine and Base Camp operational framework that
powers the commercial platform. The technology is identical; only the mission
differs.

- **Website**: [yggdrasil.komatik.xyz](https://yggdrasil.komatik.xyz)
- **Parent**: [komatik.ai](https://komatik.ai)
- **Agent Infrastructure**: [OpenClaw](https://github.com/dschirmer-shiftkey/komatik-agents)
