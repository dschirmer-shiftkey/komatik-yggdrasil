# Yggdrasil System Design

> Living document. Describes the world tree architecture, container hierarchy,
> knowledge flow, cost model, and access boundaries.

---

## 1. Hierarchy

```
Yggdrasil (the world tree)
  |
  +-- Root: Basic Needs
  |     +-- Category: Energy
  |     |     +-- Seed: 001-energy (Sub-Saharan Africa & SE Asia)
  |     +-- Category: Housing
  |     |     +-- Seed: 002-homelessness-la
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

| Level         | Count | What it is                              |
|---------------|-------|-----------------------------------------|
| Root          | 4     | Broad pillar of human need              |
| Root Category | 14    | Problem domain within a root            |
| Seed          | N     | Geographically scoped research instance |

---

## 2. Container Tiers

Each tier runs its own container(s) with a distinct role.

### Tier 1 — Root HQ (4 containers)

**Purpose:** Cross-category mission governance and synthesis.

- Reads promoted findings from all categories under it
- Spots cross-category patterns (e.g., housing + health overlap)
- Produces root-level synthesis findings
- Waters cross-category knowledge back down to categories
- Ensures the root's mission is adhered to

**Workload profile:**
- Lightweight: 1-2 agents (mission + synthesis), not a full 6-agent stack
- Runs 1-4 times/day, not continuously
- Needs smart models (Sonnet/Opus) — making judgment calls
- ~0.5 vCPU, 2 GB RAM, scale-to-zero between runs

### Tier 2 — Root Category (14 containers)

**Purpose:** Domain-specific knowledge coordination between root and seeds.

- Reviews seed findings, promotes or flags for revision
- Maintains the category knowledge base in Supabase
- Prevents duplicate research across seeds in the same category
- Routes relevant knowledge from the root down to seeds
- Distributes cross-seed learnings

**Workload profile:**
- Medium: 1-2 agents (synthesis + quality review)
- Runs a few times per day, more frequent than root HQ
- Mid-tier models (Sonnet for review, Haiku for routing)
- ~0.5-1 vCPU, 2-4 GB RAM, scale-to-zero between runs

### Tier 3 — Seed (N containers)

**Purpose:** The actual research work. Deep, geographically scoped investigation.

- Full 6-agent stack: mission, research, analysis, prototype, documentation, community
- Plus infrastructure: gateway, DB, scheduler, publisher, Bifrost
- Cycle frequency and model choice flex with sponsor budget
- ~3-4 vCPU, 4-5 GB RAM total

**Workload profile varies by budget:**
- Low budget: periodic (wake, cycle, sleep), cheap models
- Mid budget: hourly cycles, mixed models
- High budget: near-continuous, smart models

---

## 3. Knowledge Flow

Push-pull event-driven pipeline using the Supabase `knowledge_events`
and `findings` tables. Knowledge moves in both directions, and every
tier actively reads from the tiers above it.

### Core Principle: Read Up Before You Work

> Before a seed researches anything, it checks up the tree first.
> Before a category synthesizes, it reads from the root.
> Knowledge that exists anywhere in the tree should never be
> re-researched by a seed.

### 3.1 Seed Pull — Context Assembly (every cycle)

Every time a seed wakes up for a research cycle, its context assembler
queries Supabase **before agents start working**:

```
Seed context assembler (runs at cycle start):

1. Query: validated findings in my category (housing)
   -> "What does the housing category already know?"
   -> Includes findings from ALL seeds in this category
      (LA, NYC, Chicago — whatever exists)

2. Query: validated findings in my root (basic-needs)
   -> "What has the root synthesized across all categories?"
   -> Cross-category insights (housing + health overlap, etc.)

3. Query: findings tagged with my geographic scope
   -> "What do other seeds in my region know?"
   -> A hunger seed in LA might have relevant data

4. Query: superseded/retracted findings
   -> "What was previously believed but is now outdated?"
   -> Agents must not re-research or cite stale findings

5. Compare against local task queue
   -> If a planned research task matches an existing finding:
      mark it as "already known" and skip it
   -> If a finding has been superseded:
      flag any local work that depended on it for re-evaluation
```

This means a new seed on day one already knows everything the tree
knows. It starts smart, not from scratch.

### 3.2 Feed-Up — Seed to Category to Root

```
1. Seed completes a research cycle
   -> Seed writes finding to local Postgres
   -> Seed publisher posts event to Supabase:
      knowledge_events {
        event_type: "finding_ready",
        source_type: "seed",
        source_id: "002-homelessness-la",
        branch_id: "housing",      # category
        payload: { finding data }
      }

2. Category container (Housing) polls knowledge_events
   -> Reads the finding from the event payload
   -> Checks for duplicates: does this finding already exist
      in a different form from another seed?
   -> Runs quality review (smart model)
   -> If approved: writes to Supabase findings table
      findings {
        source_type: "seed",
        source_id: "002-homelessness-la",
        branch_id: "housing",
        confidence: "validated",
        ...
      }
   -> If duplicate: links via citations table, marks as
      corroborating evidence rather than new finding
   -> Writes review record:
      quality_reviews { decision: "approved", reason: "..." }
   -> Posts event:
      knowledge_events {
        event_type: "finding_promoted",
        source_type: "category",
        source_id: "housing",
        target_type: "root",
        target_id: "basic-needs"
      }

3. Root HQ (Basic Needs) polls for promoted findings
   -> Reads validated findings across housing, hunger, water, etc.
   -> Synthesizes cross-category insights
   -> Writes root-level findings:
      findings {
        source_type: "root",
        source_id: "basic-needs",
        confidence: "validated",
        ...
      }
```

### 3.3 Water-Down — Root to Category to Seed (push)

```
4. Root HQ produces a cross-category insight
   -> Posts event:
      knowledge_events {
        event_type: "knowledge_available",
        source_type: "root",
        source_id: "basic-needs",
        target_type: "category",
        target_id: "housing"   # or null for all categories
      }

5. Category container picks up the event
   -> Reads root findings relevant to its domain
   -> Filters/summarizes for its seeds
   -> Posts event:
      knowledge_events {
        event_type: "knowledge_available",
        source_type: "category",
        source_id: "housing",
        target_type: "seed"    # all seeds in this category
      }

6. Seeds pick up events on next cycle
   -> Context assembler includes new findings (see 3.1)
   -> Agents start with updated shared knowledge
```

### 3.4 Staleness Prevention

Knowledge goes stale. The system actively fights this:

**Supersession chain:**
- When a new finding contradicts or updates an older one, the category
  container sets `superseded_by` on the old finding and marks it
  `confidence: "superseded"`
- Seeds that pulled the old finding will see the supersession on their
  next context assembly and flag dependent work for re-evaluation

**Periodic freshness sweep:**
- Category containers periodically review old findings (age-based)
- Findings older than a configurable threshold without corroboration
  or citation get flagged for re-validation
- Root HQ does the same at the root level

**Task deduplication:**
- Before a seed's scheduler queues a new research task, it checks
  Supabase: "has this question been answered by any seed in my
  category or root?"
- If yes: skip the task, cite the existing finding
- If partially: scope the task to only the unanswered portion
- If the existing finding is old: re-research with the old finding
  as a starting point, not from scratch

**Retraction cascade:**
- When a finding is retracted (proven wrong), the category container
  posts a `finding_retracted` event
- All seeds that cited this finding get notified on next cycle
- Their context assembler flags dependent findings for review

### 3.5 Cross-Category Reading

Seeds can read findings from **any category in their root**, not just
their own. The context assembler queries are scoped by relevance:

```
Priority 1: My category's findings          (housing)
Priority 2: My root's synthesis findings     (basic-needs)
Priority 3: Related categories in my root    (health, hunger — tagged overlap)
Priority 4: Other roots' synthesis findings  (if tagged with relevant SDGs)
```

Context budget limits how much gets loaded (see context-budget.yaml),
so higher-priority findings get more token allocation.

### Key Principles

- **Read up before you work.** Every seed checks the tree before
  starting new research. No duplicate work.
- **Push and pull.** Categories push events down; seeds pull findings
  up. Both directions are active, not passive.
- **No tier accesses another tier's local database.** All communication
  goes through Supabase (events + findings).
- **Category is the gatekeeper.** Seeds produce raw findings; categories
  validate before promoting to the shared knowledge base.
- **Events provide audit trail.** Every knowledge movement is logged in
  `knowledge_events`, visible through the glass wall.
- **Supabase stays clean.** Only category-validated or root-synthesized
  findings land in the `findings` table.
- **Old information gets flushed.** Supersession chains, freshness
  sweeps, and retraction cascades keep the knowledge base current.
- **Resources spread evenly.** Task deduplication ensures seeds don't
  waste budget on already-solved problems.

---

## 4. Cost Model

Three cost buckets, all dynamic.

### 4.1 Cloud Compute

Containers run on cloud infrastructure. Recommended: Fargate Spot for
intermittent workloads (Tiers 1-2), Hetzner or Fargate for seeds.

| Tier | Per Unit/mo | Units | Subtotal |
|------|------------|-------|----------|
| Root HQ (0.5 vCPU, 2 GB, ~2 hr/day) | $1-2 | 4 | $4-8 |
| Category (0.5-1 vCPU, 2-4 GB, ~3 hr/day) | $2-4 | 14 | $28-56 |
| Seed — periodic (4 hr/day) | $6-20 | per seed | varies |
| Seed — always-on | $16-35 | per seed | varies |
| **Infrastructure subtotal** | | | **$32-64 + seeds** |

### 4.2 LLM API

The primary variable cost. Model choice is the biggest lever.

**Per-call cost at typical context (2K input, 1K output):**

| Model | Cost/call | Use for |
|-------|-----------|---------|
| Gemini Flash | $0.0005 | Routing, classification, simple extraction |
| GPT-4o-mini | $0.0009 | Summarization, formatting, basic synthesis |
| Claude Haiku | $0.006 | Quality review, category coordination |
| Claude Sonnet | $0.021 | Analysis, mission governance, complex synthesis |
| GPT-4o | $0.015 | Cross-category reasoning |
| Claude Opus | $0.105 | Root HQ high-stakes decisions (rare) |

**Estimated monthly LLM spend by tier:**

| Tier | Calls/day | Model mix | Est. monthly |
|------|-----------|-----------|-------------|
| Root HQ (x4) | 20-50/day each | Sonnet + Opus | $40-100 |
| Category (x14) | 30-100/day each | Haiku + Sonnet | $100-300 |
| Seed (low budget) | 50-200/day | Mini + Flash | $15-30 |
| Seed (mid budget) | 200-500/day | Haiku + Sonnet mix | $50-150 |
| Seed (high budget) | 500-2000/day | Sonnet + Opus | $150-500 |

### 4.3 Storage

| Item | Cost/mo |
|------|---------|
| Supabase (shared) | $10-25 |
| Container images (ECR/registry) | $2-5 |
| Persistent volumes per seed | $2-5 |

### 4.4 Total Cost Summary

**Komatik infrastructure (fixed):**

| Component | Low estimate | High estimate |
|-----------|-------------|---------------|
| Compute (4 roots + 14 categories) | $32 | $64 |
| LLM API (roots + categories) | $140 | $400 |
| Supabase | $10 | $25 |
| Storage | $5 | $15 |
| **Total** | **$187/mo** | **$504/mo** |

**Per seed (sponsor-funded, variable):**

| Budget tier | Compute | LLM API | Storage | Total |
|-------------|---------|---------|---------|-------|
| Minimal ($25/mo) | $6 | $15 | $4 | $25 |
| Standard ($75/mo) | $15 | $50 | $5 | $70 |
| Enhanced ($200/mo) | $25 | $165 | $10 | $200 |
| Research-intensive ($500/mo) | $35 | $450 | $15 | $500 |

---

## 5. Budget Enforcement

The system adapts to remaining budget using graceful degradation.

### Budget Tiers

| Budget consumed | System behavior |
|----------------|-----------------|
| 0-50% | Full speed: best models, normal cycle frequency |
| 50-75% | Reduce: downshift models, slower cycles |
| 75-90% | Essential only: pause non-critical agents, cheapest models |
| 90-95% | Wind down: complete in-progress work, publish summary |
| 95-100% | Hibernation: containers scale to zero, data preserved |

### How It Works

The **scheduler** is the budget enforcer:
1. On each cycle, queries `token_usage` table for current month spend
2. Compares against `sponsorships.monthly_budget_usd`
3. Adjusts cycle parameters:
   - `CYCLE_INTERVAL_MINUTES` — increase to slow down
   - `MODEL_TIER` — signal to Bifrost to use cheaper models
   - `ACTIVE_AGENTS` — which agents participate in the cycle
4. At 95%, triggers a final "wrap-up" cycle that summarizes progress
5. At 100%, stops scheduling new cycles until budget resets

**Bifrost** (AI gateway) enforces model routing:
- Reads the current model tier from scheduler
- Routes requests to appropriate model
- Tracks cost per request in `token_usage`

### Budget Reset

Monthly. On the 1st of each month (or sponsor start anniversary),
budget resets and hibernating seeds wake up automatically.

---

## 6. Access Model — The Glass Wall

### Public (anyone)

- **Can see:** All findings, progress, costs, knowledge flow events
  (via Supabase public read + komatik.ai website)
- **Can do:** Submit suggestions to a review queue
- **Cannot:** Direct research, change priorities, interact with agents,
  modify any data

### Sponsor

- **Can see:** Everything public sees + their seed's detailed internals
- **Can do:** Set/adjust their budget
- **Cannot:** Direct research priorities, command agents, override
  category/root decisions

### Komatik (operator)

- **Can do:** Operate root HQs, categories, infrastructure. Set system
  policies. Manage the world tree.

### Core Principle

> The world tree operates autonomously. The public watches through glass.
> Sponsors fund but don't drive. Komatik maintains the infrastructure.

---

## 7. Naming Convention

| Codebase term (current) | Correct term | Notes |
|------------------------|--------------|-------|
| trunk | Root | 4 broad pillars |
| branch | Root Category | 14 problem domains |
| seedling | Seed | Geographic research instances |

Rename planned but not yet executed. All new code and docs should use
the correct terms (Root, Root Category, Seed).

---

## 8. First Slice (MVP)

```
Basic Needs (root) -> Housing (category) -> LA Homelessness (seed)
```

One vertical slice proving the full knowledge flow before scaling.
This serves as the template for all other roots, categories, and seeds.

---

## 9. Open Items

- [ ] Supabase schema rename: `branch_id` -> `category_id`, `trunk_id` -> `root_id`
- [ ] Cloud provider selection (Fargate Spot vs Hetzner vs hybrid)
- [ ] Root HQ container spec (which agents, what soul files)
- [ ] Category container spec (which agents, what soul files)
- [ ] Public suggestion queue mechanism
- [ ] Sponsor dashboard / portal
- [ ] Budget reset mechanism (monthly anniversary vs calendar month)
- [ ] Local model evaluation for cost reduction
