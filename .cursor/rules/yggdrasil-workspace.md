# Yggdrasil Workspace

This is **Komatik Yggdrasil** — Komatik's charitable AI initiative. Autonomous agent
collectives ("Seedlings") working on global problems in public. Every output is
open-source under MIT (code) and CC BY 4.0 (research/findings).

## Repository Layout

```
komatik-yggdrasil/
├── infrastructure/           # Shared container specs
│   ├── compose.yaml          # Template Docker Compose for a full Seedling stack
│   ├── gateway/              # OpenClaw Gateway image (Node.js, slim)
│   │   ├── Dockerfile
│   │   ├── server.js         # Gateway entry point — session lifecycle, workflow engine
│   │   └── schema.sql        # PostgreSQL schema (sessions, workflows, agents, memory)
│   ├── agent/                # Base agent runner image
│   │   ├── Dockerfile
│   │   ├── runner.js         # Agent loop — load SOUL, check workflow, execute, save
│   │   └── souls/*.md        # 6 SOUL.md templates (one per agent role)
│   ├── publisher/            # Git output pipeline
│   │   ├── Dockerfile
│   │   ├── index.js          # Watch /output → validate → batch commit → push
│   │   └── package.json
│   ├── scheduler/            # Portable cycle loop manager
│   │   ├── Dockerfile
│   │   ├── index.js          # Cron replacement — triggers cycle phases via gateway API
│   │   └── package.json
│   ├── bifrost/              # LLM proxy config
│   │   └── config.template.json  # Bifrost AI Gateway config (providers, virtual keys)
│   ├── config/               # Shared operational configs
│   │   ├── rbac-policies.yaml    # Role-based access control
│   │   ├── agent-capacity.yaml   # Concurrency and rate limits
│   │   └── context-budget.yaml   # Token budget per agent role
│   └── .env.example          # Required environment variables
├── seedlings/
│   └── 001-energy/           # First Seedling — Solving energy poverty
│       ├── MISSION.md        # Immutable mission statement (human-authored)
│       ├── AGENTS.md         # Seedling-specific agent protocol
│       ├── FINDINGS.md       # Accumulated research (agent-written)
│       ├── TOKENS.md         # Public compute ledger (auto-generated)
│       └── config/           # Overrides for this Seedling
│           ├── agents/*.yaml # 6 agent configs with domain-tuned prompts
│           ├── bifrost.json  # Budget cap ($50/month initial)
│           └── compose.override.yaml
├── AGENTS.md                 # Global Seedling agent collective protocol
├── CONTRIBUTING.md           # External contribution guidelines
├── README.md                 # Public-facing overview
├── LICENSE                   # MIT (code)
└── LICENSE-CC-BY-4.0         # CC BY 4.0 (research/findings)
```

## Key Concepts

- **Seedling**: A self-contained Docker Compose stack with 6 AI agents, a gateway,
  database, LLM proxy, scheduler, and publisher — all focused on one global mission.
- **Bifrost**: Go-based AI gateway (Apache 2.0) that routes all LLM calls, enforces
  per-Seedling budget caps via virtual keys, and exports Prometheus metrics.
- **Publisher**: Sidecar service that validates agent outputs and commits them to this
  repo. Only service with GitHub credentials.
- **Cycle**: One iteration of the Research → Synthesize → Model → Prototype → Document → Publish loop.
- **TOKENS.md**: Public ledger showing every token of compute donated to this Seedling.

## GitHub

- **Repo**: [dschirmer-shiftkey/komatik-yggdrasil](https://github.com/dschirmer-shiftkey/komatik-yggdrasil)
- **Branch**: `main`
- **CI**: `.github/workflows/validate.yml` — validates Seedling structure and TOKENS.md format
- **Domain**: `yggdrasil.komatik.xyz` (pending DNS)
