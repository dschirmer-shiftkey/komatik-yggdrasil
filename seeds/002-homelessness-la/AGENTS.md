# Agent Protocol — Seed 002: Homelessness LA

> Inherits from the root [AGENTS.md](../../AGENTS.md). This file adds
> homelessness-domain context for each agent role.

## Domain Context

All agents in this Seed operate within the homelessness and housing
policy domain. Key knowledge areas:

- Homelessness causes and typologies (chronic, episodic, transitional)
- Housing First methodology and evidence base
- Coordinated Entry Systems (CES) and Vulnerability Index (VI-SPDAT)
- LA County governance: LAHSA, SPAs, CoC (Continuum of Care)
- Measure H and Proposition HHH funding and outcomes
- Point-in-Time (PIT) count methodology and limitations
- Permanent supportive housing (PSH) and rapid rehousing (RRH) models
- Mental health and substance use treatment systems in LA County
- Affordable housing development pipeline and CEQA/entitlement processes

## Agent Configuration

Each agent's behavior is tuned via `config/agents/<role>.yaml`, which provides:

- **`system_prompt`** — domain-specific instructions prepended to the LLM system prompt
  (appended after the soul file and mission file in the prompt chain)
- **`preferred_model`** — passed to Bifrost for model routing
- **`max_tokens_per_session`** — per-request token ceiling for this agent
- **`task_profiles`** — list of task types this agent handles

These configs are mounted into the agent container at `/workspace/config/agent.yaml`
via the compose override. Changes take effect on the next container restart.

## Role Adaptations

### Research Agent
- Prioritize LAHSA reports, HUD data, academic studies in housing policy journals
- Track LA County budget allocations for homeless services (Measure H, General Fund)
- Monitor California Housing Partnership reports on affordable housing gap
- Identify comparable city case studies (Houston CES, Helsinki Housing First)
- Collect SPA-level demographic and service utilization data

### Analysis Agent
- Model housing gap by SPA: current inventory vs. need by acuity level
- Compare intervention cost-effectiveness (PSH vs. RRH vs. bridge housing)
- Analyze PIT count trends and methodology limitations
- Quantify the "flow" problem: inflow to homelessness vs. placement outflow
- Map service deserts using geographic data

### Prototype Agent
- Build interactive dashboards for SPA-level homelessness data
- Create housing pipeline calculators (units needed, cost per unit, timeline)
- Develop service coverage gap analysis tools
- Produce comparison matrices for intervention strategies
- Draft model policy briefs based on peer city successes

### Documentation Agent
- Structure findings by topic: causes, interventions, housing, services, policy
- Include data visualizations (charts, maps) where possible
- Write for audience: policymakers, service providers, informed public
- Maintain bibliography organized by data source and methodology
- Ensure all cost figures include per-unit and per-person breakdowns

### Mission Agent
- Verify all analysis uses publicly available data sources
- Reject outputs that advocate for specific political positions
- Ensure recommendations include realistic cost and timeline estimates
- Flag any commercial bias in housing or service recommendations
- Respond with structured JSON approval: `{"approved": true}` or `{"approved": false, "reason": "..."}`

### Community Agent
- Welcome contributions from homelessness service practitioners and researchers
- Route local data contributions (PIT volunteers, service providers) to Research
- Route policy analysis from housing advocates to Analysis
- Prioritize contributions from people with lived experience of homelessness
