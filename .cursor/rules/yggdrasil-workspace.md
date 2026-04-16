# Yggdrasil Workspace

This is **Komatik Yggdrasil** — Komatik's charitable AI initiative. Autonomous agent
collectives ("Seedlings") working on global problems in public. Every output is
open-source under MIT (code) and CC BY 4.0 (research/findings).

## Repository Layout

```
komatik-yggdrasil/
├── infrastructure/           # Shared container specs
│   ├── compose.yaml          # Template Docker Compose for a full Seedling stack
│   ├── gateway/              # OpenClaw Gateway (Node.js, slim)
│   │   ├── server.js         # HTTP server — /health, /api/tool (RBAC-enforced), /api/tools
│   │   ├── tools.js          # 17 tool handler implementations
│   │   ├── rbac.js           # Role-based access control engine (deny-by-default)
│   │   ├── migrate.js        # Transactional PostgreSQL migration runner
│   │   ├── schema.sql        # Base schema (sessions, workflows, decisions, messages, tasks, llm_usage)
│   │   └── test/             # RBAC + tool registry unit tests (25 tests)
│   ├── agent/                # Base agent runner image
│   │   ├── runner.js         # Agent loop — context assembly, atomic claiming, LLM calls, decisions
│   │   ├── lib/              # Context assembler, decisions, memory modules
│   │   ├── souls/*.md        # 6 behavioral directive templates (one per role)
│   │   └── test/             # Context assembler + decisions unit tests (5 tests)
│   ├── publisher/            # Git output pipeline + TOKENS.md generator
│   │   └── index.js          # Artifact validation → mission gate → git push
│   ├── scheduler/            # Cycle loop manager
│   │   └── index.js          # Workflow creation, step retry (2x), circuit breaker (5 failures)
│   ├── bifrost/              # Custom Bifrost Dockerfile + env var entrypoint
│   │   ├── Dockerfile        # Extends maximhq/bifrost with entrypoint.sh
│   │   └── entrypoint.sh     # Runtime ${ENV_VAR} substitution in config
│   ├── config/               # Shared operational configs
│   │   ├── rbac-policies.yaml    # Role → tool authorization matrix
│   │   ├── agent-capacity.yaml   # max_concurrent_steps per role (enforced)
│   │   └── context-budget.yaml   # Token budget per context section
│   └── .env.example          # Legacy location (root .env.example is canonical)
├── seedlings/
│   └── 001-energy/           # First Seedling — Solving energy poverty
│       ├── MISSION.md        # Immutable mission statement (human-authored)
│       ├── AGENTS.md         # Energy-domain agent protocol adaptations
│       ├── FINDINGS.md       # Accumulated research (agent-written)
│       ├── TOKENS.md         # Public compute ledger (auto-generated from DB)
│       ├── RESEARCH/         # Raw research artifacts
│       ├── MODELS/           # Data models and simulations
│       ├── PROTOTYPES/       # Code and design proof-of-concepts
│       └── config/           # Overrides for this Seedling
│           ├── agents/*.yaml # 6 agent configs (system_prompt, preferred_model, max_tokens)
│           ├── bifrost.json  # LLM provider config (env var placeholders)
│           └── compose.override.yaml  # Mounts configs into base containers
├── docs/
│   └── adr/                  # Architecture Decision Records
│       └── 001-agent-gateway-bypass.md
├── .env.example              # Root-level env template — copy to .env
├── AGENTS.md                 # Global Seedling agent collective protocol
├── CONTRIBUTING.md           # External contribution guidelines
├── README.md                 # Public-facing overview with Quick Start
├── LICENSE                   # MIT (code)
└── LICENSE-CC-BY-4.0         # CC BY 4.0 (research/findings)
```

## Key Concepts

- **Seedling**: A self-contained Docker Compose stack with 6 AI agents, a gateway,
  database, LLM proxy, scheduler, and publisher — all focused on one global mission.
- **Bifrost**: Go-based AI gateway (Apache 2.0) that routes all LLM calls, enforces
  per-Seedling budget caps via virtual keys. Custom Dockerfile handles env var templating.
- **Publisher**: Sidecar service that validates agent outputs against the mission
  approval gate and commits them to this repo. Only service with GitHub credentials.
- **Scheduler**: Creates workflows, monitors step completion, retries failures (2x per step),
  and trips a circuit breaker after 5 total failures. Parses structured JSON approval from
  the mission agent.
- **Cycle**: One iteration of the Research → Analysis → Prototype → Document → Mission Review → Publish loop.
- **TOKENS.md**: Public ledger showing every token of compute donated to this Seedling,
  generated from the `llm_usage` PostgreSQL table.

## GitHub

- **Repo**: [dschirmer-shiftkey/komatik-yggdrasil](https://github.com/dschirmer-shiftkey/komatik-yggdrasil)
- **Main branch**: `main` — all infrastructure work merged (PRs #1–#4)
- **CI**: `.github/workflows/validate.yml` — structure validation, Docker builds, syntax checks (recursive), unit tests
- **Domain**: `yggdrasil.komatik.xyz` (pending DNS)

## Running Locally

```bash
cp .env.example .env  # fill in API keys and passwords
docker compose --project-directory . \
  -f infrastructure/compose.yaml \
  -f seedlings/001-energy/config/compose.override.yaml up
```
