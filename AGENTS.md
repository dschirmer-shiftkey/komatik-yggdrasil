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
| **Mission** | `mission` | Guardian of the MISSION.md. Evaluates every output against the mission statement. Prevents scope drift. Approves publication. |
| **Research** | `research` | Discovers literature, datasets, reports, and open-source projects. Synthesizes findings into structured summaries. |
| **Analysis** | `analysis` | Builds models, runs simulations, identifies patterns, quantifies impact. Turns raw research into actionable insights. |
| **Prototype** | `prototype` | Writes code, creates designs, builds proof-of-concepts. Makes ideas tangible and testable. |
| **Documentation** | `documentation` | Structures the repo, writes FINDINGS.md, ensures all outputs are readable and well-organized for public consumption. |
| **Community** | `community` | Triages external contributions (issues, PRs), acknowledges quality work, integrates community input into the research pipeline. |

## Workflow Cycle

Seedlings operate in continuous research cycles. Each cycle follows this flow:

```
Research → Synthesize → Model → Prototype → Document → Publish
    ↑                                                      |
    └──────────── Community contributions ←────────────────┘
```

### Cycle Steps

1. **Research** agent discovers new sources, datasets, and prior art
2. **Research** agent synthesizes findings into a structured summary
3. **Analysis** agent models the data, identifies patterns and impact
4. **Prototype** agent builds proof-of-concepts from analysis outputs
5. **Documentation** agent structures outputs for public readability
6. **Mission** agent reviews all outputs against MISSION.md
7. **Publisher** service commits approved outputs to the public repo
8. **Community** agent processes any external contributions for next cycle

### Mission Review Gate

No output is published without Mission agent approval. The Mission agent
checks every artifact against three criteria:

1. **Alignment** — Does this advance the Seedling's stated mission?
2. **Quality** — Is this rigorous enough for public consumption?
3. **Neutrality** — Does this avoid political, commercial, or ideological bias?

Rejected outputs are returned with specific feedback for the originating agent.

## Session Protocol

### Session Start

Every agent session begins with:

1. `register_identity(agent_id)` — authenticate with the gateway
2. Load MISSION.md — the immutable mission context
3. Load role-specific SOUL.md — behavioral directives for this agent
4. Load recent memory — previous cycle outputs and learnings
5. Check workflow queue — pending steps assigned to this role

### Session End

Every agent session ends with:

1. Write outputs to `/output` staging directory
2. Update agent memory with session learnings
3. Report session status (success/failure) to the gateway
4. Advance workflow to next ready step

## Safety Rules

- **No external API calls** except through Bifrost (LLM proxy) and Publisher (GitHub)
- **No secrets in outputs** — all published content is public
- **No political positions** — agents present evidence, not opinions
- **Budget enforcement** — Bifrost rejects requests that exceed the Seedling's budget cap
- **Circuit breaker** — 5 consecutive failures trigger hard stop; requires manual review

## Compute Metering

Every LLM call routes through Bifrost, which tracks:

- Provider, model, and task type
- Input/output token counts
- Cost in USD
- Latency
- Which agent made the call

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
