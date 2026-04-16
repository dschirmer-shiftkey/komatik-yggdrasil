# Yggdrasil

> *In Norse cosmology, Yggdrasil is the immense ash tree at the center of
> everything. Its roots reach into three wells of wisdom. Its branches hold
> nine realms. The gods gather at its base each day to govern. The Norns water
> its roots to keep it alive. A squirrel named Ratatoskr runs up and down the
> trunk, carrying messages between the eagle in the crown and the dragon at the
> roots — connecting the highest and lowest points of the known world.*
>
> *Odin, the Allfather, sacrificed his eye to drink from Mimir's Well at the
> base of the tree. The price of wisdom was steep, but the knowledge was worth
> more than sight. The tree taught the Norse something fundamental: knowledge
> isn't free, it flows between realms, and the whole cosmos depends on tending
> the roots.*

---

## The Story

We named this project Yggdrasil because the metaphor is almost too perfect.

The World Tree connects realms that would otherwise be isolated. It doesn't
hoard wisdom in one place — it moves knowledge up from the roots, down from
the crown, and between branches. The Well of Urd holds the water of fate. The
Well of Mimir holds the water of knowledge. The Norns tend the tree daily so
it doesn't wither. The eagle sees everything from above. The dragon gnaws from
below, a reminder that knowledge decays if you stop tending it.

Our Yggdrasil does the same thing, but for humanity's hardest problems.

Instead of nine realms, we have four **roots**: Basic Needs, Human Growth,
Planet & Life, and Society & Systems. Instead of the eagle's far-seeing
vision, we have **root-level synthesis** that spots patterns across
categories. Instead of Ratatoskr running messages between crown and roots, we
have **knowledge events** flowing through a shared database. Instead of Odin's
sacrifice for wisdom, we have Komatik pledging compute — because knowledge
should cost the one seeking it, not the ones who need it.

And like the Norns watering the roots each day, our agents read from the tree
before every research cycle. Knowledge that exists anywhere in the tree is
never re-researched by a seed. The tree remembers, so its seeds don't have to
start from scratch.

---

## The Mission

Yggdrasil is a network of autonomous AI agent collectives working on global
problems in public. Every research finding, every data model, every prototype
is committed to this repository under open-source licenses. There is no
product to sell, no customers to serve, no engagement metrics to optimize. The
only directive is the mission.

The problems are real: homelessness in Los Angeles, energy access in
Sub-Saharan Africa, food insecurity, clean water, climate adaptation. These
aren't abstract research topics — they are measurable gaps where evidence-based
approaches can make a difference but where the research is scattered,
expensive, or locked behind paywalls.

Yggdrasil doesn't solve these problems alone. It researches, models, and
proposes. It produces open-source findings that anyone — governments, NGOs,
researchers, communities — can use. The value is in doing the work that
nobody funds because the returns are measured in human outcomes, not revenue.

### What Makes This Different

- **Autonomous, not supervised.** Agents run research cycles continuously.
  Humans set the mission and review outputs, but the agents decide what to
  research, how to analyze it, and when findings are ready.

- **Open by default.** Every token spent, every finding produced, every
  decision made is logged and published. The `TOKENS.md` in each seed is a
  public ledger of compute donated by Komatik.

- **Knowledge compounds.** A new seed on day one already knows everything the
  tree knows. It reads up before it works. Findings flow from seeds to
  categories to roots and back down. Nothing is re-researched.

- **Independently funded.** Each seed has its own sponsor and budget. Komatik
  seeds the infrastructure, but anyone can sponsor a seed. A hunger seed in
  Mumbai and a hunger seed in Lagos share knowledge but operate on independent
  budgets.

- **Quality-gated.** Seeds produce raw findings. Categories validate before
  promoting. Roots synthesize across categories. Bad findings get retracted,
  stale findings get superseded, and the retraction cascades to everything that
  cited them.

---

## The World Tree

Yggdrasil organizes all work into a three-tier hierarchy:

```
Yggdrasil
  |
  +-- Root: Basic Needs
  |     +-- Category: Energy
  |     |     +-- Seed: 001-energy (Sub-Saharan Africa & SE Asia)
  |     +-- Category: Housing
  |     |     +-- Seed: 002-homelessness-la (Los Angeles County)
  |     +-- Category: Hunger
  |     +-- Category: Water
  |     +-- Category: Health
  |
  +-- Root: Human Growth
  |     +-- Category: Education
  |     +-- Category: Economic Opportunity
  |     +-- Category: Equality
  |
  +-- Root: Planet & Life
  |     +-- Category: Climate
  |     +-- Category: Oceans
  |     +-- Category: Ecosystems
  |
  +-- Root: Society & Systems
        +-- Category: Peace
        +-- Category: Community
        +-- Category: Digital Access
```

| Level | Count | Role |
|-------|-------|------|
| **Root** | 4 | Cross-category synthesis and mission governance |
| **Category** | 14 | Domain-specific knowledge coordination and quality review |
| **Seed** | N | Geographically scoped deep research — the actual work |

### Active Seeds

| Category | Seed | Scope | Status |
|----------|------|-------|--------|
| Energy | [001-energy](seeds/001-energy/) | Sub-Saharan Africa & SE Asia | Infrastructure Ready |
| Housing | [002-homelessness-la](seeds/002-homelessness-la/) | Los Angeles County | Planned |

All other categories are open for proposals. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Knowledge Flow

Like the Norse tree where wisdom flows between wells and realms, knowledge in
Yggdrasil flows in both directions through the hierarchy.

### Read Up Before You Work

Every time a seed wakes for a research cycle, its context assembler queries the
shared world tree:

1. **Category findings** — what do other seeds in my category already know?
2. **Root synthesis** — what has the root discovered across all its categories?
3. **Geographic peers** — what do seeds in my region but different categories know?
4. **Superseded findings** — what was previously believed but is now outdated?

A new seed on day one starts with the full knowledge of the tree.

### Feed Up — Seed to Category to Root

```
Seed completes research → publishes finding (preliminary) + finding_ready event
    ↓
Category validates quality, checks for duplicates
    ↓
If approved → promotes to validated + finding_promoted event
    ↓
Root receives promoted findings → synthesizes cross-category insights
```

### Water Down — Root to Category to Seed

```
Root produces cross-category insight → knowledge_available event
    ↓
Category filters and summarizes for its seeds → knowledge_available event
    ↓
Seeds pick up on next cycle via context assembly
```

### Staleness Prevention

Knowledge decays — just as Nidhogg gnaws at Yggdrasil's roots:

- **Supersession chains**: new findings replace old ones, linked by `superseded_by`
- **Freshness sweeps**: old findings without corroboration get flagged for re-validation
- **Retraction cascades**: when a finding is proven wrong, everything that cited it gets flagged
- **Task deduplication**: before researching, check if the question has already been answered

---

## Infrastructure

### Seed Architecture

Each seed is a self-contained containerized stack:

```
                    ┌─────────────────────────────────────────┐
                    │              Seed Container              │
                    │                                         │
  Bifrost ←────────►│  Mission  Research  Analysis  Prototype │
  (LLM proxy)       │                                         │
                    │  Documentation  Community               │
                    │       ↕            ↕                    │
                    │   ┌────────────────────┐                │
                    │   │  OpenClaw Gateway   │  17 RBAC tools│
                    │   └────────┬───────────┘                │
                    │            ↕                            │
                    │   ┌────────────────┐                    │
                    │   │   PostgreSQL    │  local state      │
                    │   └────────────────┘                    │
                    │            ↕                            │
                    │   Scheduler ──► Publisher ──► GitHub     │
                    │                    ↓                    │
                    │              Supabase (shared)           │
                    └─────────────────────────────────────────┘
```

| Component | Role |
|-----------|------|
| **6 Agents** | Mission, Research, Analysis, Prototype, Documentation, Community |
| **OpenClaw Gateway** | RBAC-enforced tool surface (17 tools), health checks, migration runner |
| **Bifrost** | LLM proxy with per-seed cost metering and budget enforcement |
| **Scheduler** | Cycle loop with step retry (2x) and circuit breaker (5 failures) |
| **PostgreSQL** | Local operational state — workflows, decisions, agent messages |
| **Publisher** | Validates artifacts, commits to GitHub, publishes findings to Supabase |

### Container Tiers

| Tier | Resources | Agents | Cycle Frequency |
|------|-----------|--------|-----------------|
| **Root HQ** (x4) | 0.5 vCPU, 2 GB | Mission + Synthesis | 1-4x/day |
| **Category** (x14) | 0.5-1 vCPU, 2-4 GB | Mission + Synthesis + Event Processor | Several times/day |
| **Seed** (xN) | 3-4 vCPU, 4-5 GB | Full 6-agent stack | Budget-dependent |

### Research Cycle

```
Scheduler creates workflow
    ↓
Research → Analysis → Prototype → Documentation → Mission Review
    ↑                                                      |
    └──────────── Community contributions ←────────────────┘
                                                           ↓
                      Publisher commits to GitHub + publishes to Supabase
```

The Mission agent reviews all outputs:

```json
{"approved": true}
```

or:

```json
{"approved": false, "reason": "Analysis assumes grid-connected inverter availability"}
```

Only approved outputs are published. Failed steps retry up to 2 times. The
circuit breaker trips after 5 consecutive failures.

### Two-Layer Data Model

| Layer | Technology | What Lives Here |
|-------|-----------|-----------------|
| **Local** | PostgreSQL (per container) | Workflows, steps, sessions, decisions, agent messages, tasks |
| **Shared** | Supabase | Findings, knowledge events, citations, quality reviews, token usage, sponsorships |

No tier accesses another tier's local database. All cross-tier communication
flows through Supabase — the shared well of knowledge at the base of the tree.

---

## Quick Start

```bash
# Clone
git clone https://github.com/dschirmer-shiftkey/komatik-yggdrasil.git
cd komatik-yggdrasil

# Configure
cp infrastructure/.env.example infrastructure/.env
# Edit .env — fill in POSTGRES_PASSWORD, LLM API key(s), GITHUB_TOKEN,
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Boot a Seed
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml up
```

### Running Tests

```bash
cd infrastructure/agent  && npm ci && npm test   # context assembler, decisions
cd infrastructure/gateway && npm ci && npm test   # RBAC, tool registry
```

### Vertical Slice Test

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
node infrastructure/scripts/test-vertical-slice.js
```

Exercises the full pipeline: seed publish, category validate, promote, root
acknowledge, context assembly read-back.

---

## The Pledge

Komatik pledges **1% of platform compute** to Yggdrasil. As the platform
grows, so does the budget. Every token is tracked in each seed's `TOKENS.md`.

| Phase | Trigger | Action |
|-------|---------|--------|
| Phase 1 | Pre-revenue | Flat monthly budget per seed |
| Phase 2 | First consistent revenue | Open Donor-Advised Fund (DAF) |
| Phase 3 | Sufficient scale | Graduate to 501(c)(3) foundation |

---

## Repository Structure

```
komatik-yggdrasil/
├── infrastructure/
│   ├── compose.yaml              # Base Docker Compose template
│   ├── .env.example              # Environment variables
│   ├── gateway/                  # OpenClaw Gateway — RBAC, tools, migrations
│   ├── agent/                    # Agent runner + context assembler
│   ├── publisher/                # Git pipeline + Supabase knowledge publisher
│   ├── scheduler/                # Cycle orchestration + circuit breaker
│   ├── event-processor/          # Knowledge event processor (category/root tiers)
│   ├── shared/                   # Shared Supabase client module
│   ├── bifrost/                  # LLM proxy gateway
│   ├── scripts/                  # E2E test scripts
│   └── config/                   # RBAC policies, agent capacity, context budgets
├── roots/
│   └── basic-needs/              # Root HQ config + mission
├── categories/
│   ├── energy/                   # Category knowledge base
│   └── housing/                  # Category knowledge base
├── seeds/
│   ├── 001-energy/               # Sub-Saharan Africa & SE Asia
│   └── 002-homelessness-la/      # Los Angeles County
├── docs/
│   ├── system-design.md          # Full architecture specification
│   └── adr/                      # Architecture Decision Records
├── tree.yaml                     # Machine-readable registry (roots, categories, seeds)
├── AGENTS.md                     # 6-agent collective protocol
└── CONTRIBUTING.md               # How to propose seeds and contribute
```

---

## Licensing

- **Code and infrastructure**: [MIT License](LICENSE)
- **Research, findings, and documentation**: [CC BY 4.0](LICENSE-CC-BY-4.0)
- **Komatik brand assets**: All rights reserved

---

## Part of the Komatik Ecosystem

Yggdrasil runs on the same agent infrastructure that powers Komatik's
commercial platform — the same orchestration engine, the same operational
framework. The technology is identical; only the mission differs.

- **Website**: [yggdrasil.komatik.xyz](https://yggdrasil.komatik.xyz)
- **Parent**: [komatik.ai](https://komatik.ai)
- **Agent Infrastructure**: [OpenClaw](https://github.com/dschirmer-shiftkey/komatik-agents)
