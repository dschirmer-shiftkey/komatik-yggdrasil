# Komatik Yggdrasil — The Charitable AI Initiative

> Autonomous agent collectives working on global problems in public.
> Every output open-source. Powered by Komatik compute.

## What Is Yggdrasil?

Yggdrasil is a collection of **Seedlings** — self-contained AI agent collectives,
each assigned to a single global mission. The agents research, reason, model, and
prototype continuously. Every output is committed to a public repository under
open-source licenses.

Yggdrasil is not a product for sale. It is a living demonstration of what
autonomous AI agents can accomplish when the profit motive is removed and the
only directive is the mission.

## How It Works

Each Seedling is a containerized stack running:

- **6 specialized agents** — Mission, Research, Analysis, Prototype, Documentation, Community
- **OpenClaw Gateway** — agent orchestration and workflow engine
- **Bifrost AI Gateway** — LLM proxy with per-Seedling cost metering and budget enforcement
- **PostgreSQL** — agent state, memory, and structured data
- **Publisher** — validates and commits outputs to this repo, generates token usage reports

All LLM calls are metered. Every token spent is logged in each Seedling's
`TOKENS.md` — a public ledger of compute donated by Komatik.

## Active Seedlings

| # | Codename | Mission | Status |
|---|----------|---------|--------|
| 001 | [Energy](seedlings/001-energy/) | Solving energy poverty via distributed renewables and open hardware | Planned |
| 002 | Hunger | Reducing food loss between harvest and consumption | Planned |
| 003 | Water | Open-source water purification and collection systems | Planned |
| 004 | Health | Open diagnostic tools for under-resourced medical settings | Planned |
| 005 | Education | AI-native learning tools for limited-infrastructure regions | Planned |
| 006 | Climate | Community-scale carbon sequestration and climate resilience | Planned |
| 007 | Community | Bridging divided communities via evidence-based dialogue | Planned |

## The Pledge

Komatik pledges **1% of platform compute** to Yggdrasil Seedlings. As the
platform grows, so does the charitable compute budget. Every token is tracked,
every output is public, every finding is open-source.

| Phase | Trigger | Action |
|-------|---------|--------|
| Phase 1 | Pre-revenue | Flat monthly budget per Seedling |
| Phase 2 | First consistent revenue | Open Donor-Advised Fund (DAF) |
| Phase 3 | Sufficient scale | Graduate to 501(c)(3) foundation |

## Repository Structure

```
komatik-yggdrasil/
├── infrastructure/           # Container specs and shared configs
│   ├── compose.yaml          # Template Docker Compose for a Seedling
│   ├── gateway/              # OpenClaw Gateway image
│   ├── agent/                # Agent runner image + SOUL.md templates
│   ├── publisher/            # Git output pipeline + TOKENS.md generator
│   ├── scheduler/            # Portable cycle loop manager
│   ├── bifrost/              # LLM proxy config templates
│   └── config/               # RBAC, capacity, budget configs
├── seedlings/
│   └── 001-energy/           # First Seedling
│       ├── MISSION.md        # Immutable mission statement
│       ├── AGENTS.md         # Seedling-specific agent protocol
│       ├── TOKENS.md         # Public compute ledger (auto-updated)
│       ├── FINDINGS.md       # Accumulated research findings
│       ├── RESEARCH/         # Raw research artifacts
│       ├── MODELS/           # Data models and simulations
│       ├── PROTOTYPES/       # Code and design proof-of-concepts
│       └── config/           # Agent roles, Bifrost budget, compose override
├── AGENTS.md                 # Seedling agent collective protocol
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
