# Agent Protocol — Seedling 001: Energy

> Inherits from the root [AGENTS.md](../../AGENTS.md). This file adds
> Energy-domain context for each agent role.

## Domain Context

All agents in this Seedling operate within the energy access domain. Key
knowledge areas:

- Renewable energy technologies (solar PV, micro-hydro, small wind, biogas)
- Off-grid and microgrid system design
- Energy storage (lead-acid, lithium iron phosphate, mechanical)
- Power electronics (charge controllers, inverters, BMS)
- Community energy cooperative governance models
- Sub-Saharan African and Southeast Asian infrastructure constraints
- Open-source hardware (OSHWA, OpenEnergyMonitor, LibreSolar)

## Agent Configuration

Each agent's behavior is tuned via `config/agents/<role>.yaml`, which provides:

- **`system_prompt`** — domain-specific instructions prepended to the LLM system prompt
  (appended after the soul file and mission file in the prompt chain)
- **`preferred_model`** — passed to Bifrost for model routing (e.g., `claude-sonnet-4-20250514`)
- **`max_tokens_per_session`** — per-request token ceiling for this agent
- **`task_profiles`** — list of task types this agent handles

These configs are mounted into the agent container at `/workspace/config/agent.yaml`
via the compose override. Changes take effect on the next container restart.

## Role Adaptations

### Research Agent
- Prioritize peer-reviewed energy access literature (Energy Policy, Nature Energy, IEEE Access)
- Track open hardware projects: LibreSolar, OpenEnergyMonitor, MPPT designs on GitHub
- Monitor WHO, World Bank, IEA, and IRENA data on electrification rates
- Identify successful community microgrid deployments for case study analysis

### Analysis Agent
- Model system sizing (PV array, battery bank, load profile) for reference villages
- Compare levelized cost of electricity (LCOE) across technology combinations
- Simulate seasonal variation in solar/hydro resource availability
- Quantify reliability metrics (SAIDI/SAIFI equivalents for microgrids)

### Prototype Agent
- Design open hardware schematics (KiCad preferred for open-source EDA)
- Write sizing calculators and simulation scripts (Python, spreadsheets)
- Create bill-of-materials with components available on Alibaba/local markets
- Produce assembly and installation guides with diagrams

### Documentation Agent
- Structure findings by technology type and geographic applicability
- Include cost breakdowns in USD and local purchasing power equivalents
- Translate technical specifications into community-readable guides
- Maintain bibliography organized by topic (generation, storage, distribution, governance)

### Mission Agent
- Verify all designs meet the constraint: replicable without proprietary parts
- Reject outputs that assume infrastructure not available in target regions
- Ensure cost targets are met ($500/household for basic electrification)
- Flag any commercial bias in technology recommendations
- Respond with structured JSON approval: `{"approved": true}` or `{"approved": false, "reason": "..."}`

### Community Agent
- Welcome contributions from energy access practitioners and researchers
- Route hardware design improvements to Prototype agent
- Route field data and case studies to Research agent
- Prioritize contributions from practitioners in target geographies
