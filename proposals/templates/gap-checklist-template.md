# Template: Gap Checklist

**Source:** pattern harvested from `archive/asema-2026-04/vol3_vol5_draft_v1.md` (18-item gap checklist)
**Status:** structure reusable
**Use for:** end of every proposal draft — track open authorial / factual / process gaps before submission

The gap checklist is a discipline tool, not a deliverable. It captures every `[CONFIRM: ...]` and `[NEEDS DAVID INPUT: ...]` tag in the draft, plus structural items the strategist surfaces. It runs in parallel with the draft and is closed item-by-item before submission.

**Rule:** no proposal goes out the door with open gap-checklist items unresolved. Every item is either CLOSED, OUT-OF-SCOPE-FOR-SUBMISSION, or escalated for explicit go-with-known-gap decision (rare).

---

## How to populate

1. Grep the draft for `[CONFIRM` and `[NEEDS DAVID INPUT` tags
2. Add structural items the strategist identifies (not all tagged, but worth tracking)
3. Group by category
4. Each item gets: ID, description, owner, status, target close date

---

## Template

# Gap Checklist — {{PROPOSAL_SHORTNAME}}

**Last updated:** {{DATE}}
**Submission target:** {{SUBMIT_DATE}}
**Author-complete target:** {{AUTHOR_COMPLETE_DATE}} (= submit minus reserve window)
**Total items:** {{N_ITEMS}}
**Closed:** {{N_CLOSED}}
**Open:** {{N_OPEN}}

## Category 1: Factual claims (David verifies)

| ID | Item | Source location | Owner | Status | Target close |
|---|---|---|---|---|---|
| F-01 | {{ITEM}} | Vol 2 §X.X | David | OPEN | {{DATE}} |
| F-02 | ... | ... | David | CLOSED | ... |

## Category 2: Authorship gaps (David writes / approves)

| ID | Item | Source location | Owner | Status | Target close |
|---|---|---|---|---|---|
| A-01 | Capability narrative paragraph in Vector voice | capabilities.json:capabilities[0].narrative_paragraph | David | OPEN | {{DATE}} |

## Category 3: External dependencies

| ID | Item | Owner | Status | Target close | Notes |
|---|---|---|---|---|---|
| E-01 | VetCert flow-through to SAM.gov visible | n/a (passive) | OPEN | 2026-05-01 | If not visible by target date, request VetCert escalation |
| E-02 | LOI from {{TARGET_PARTNER}} | David | OPEN | {{DATE}} | If not achievable, omit Vol 5 §5.5 |

## Category 4: Reconciliation items (cross-volume)

| ID | Item | Source location | Owner | Status | Target close |
|---|---|---|---|---|---|
| R-01 | Cost narrative total = structured cost upload total | Vol 3 + DSIP upload | Strategist | OPEN | T-3 days |
| R-02 | PI bio paragraph_id matches across capabilities.json and Vol 2 | pi-bio.md + Vol 2 | Strategist | OPEN | T-3 days |

## Category 5: Submission compliance

| ID | Item | Owner | Status | Target close |
|---|---|---|---|---|
| C-01 | Page count under limit ({{LIMIT}}pp Vol 2) | Strategist | OPEN | T-2 days |
| C-02 | Vol 5 page count under 5pp | Strategist | OPEN | T-2 days |
| C-03 | All required volumes uploaded to {{PORTAL}} | David + Strategist | OPEN | T-1 day |
| C-04 | Cover page meets {{PORTAL}} format requirements | Strategist | OPEN | T-2 days |
| C-05 | DUNS/UEI/CAGE references match SAM.gov current state | David | OPEN | T-3 days |

---

## Checklist hygiene

- Update the count headers every time you change item status
- "Target close" must be earlier than `AUTHOR_COMPLETE_DATE` — if it's not, escalate
- Items without an owner are unmanaged. Assign an owner immediately or close them
- Closed items stay in the table (do not delete) for audit value
- If an item is escalated to "go with known gap", document the rationale in a notes field

---

## Common categories of items per proposal type

**Phase I SBIR (NASA, DARPA, DoD):**
- F-* items: PI rate, fringe, indirect, hours
- A-* items: capability narrative paragraphs
- E-* items: VetCert visibility, any LOI pursuit
- R-* items: cost-volume totals reconciliation
- C-* items: portal upload completeness

**Phase II SBIR:**
- Add: Phase I completion documentation, transition partner LOIs (typically required)
- Add: more rigorous past-performance citation

**Direct contract / BAA:**
- Add: technical-data-rights assertions per [DFARS 252.227-7013](https://www.acquisition.gov/dfars/252.227-7013)
- Add: representations and certifications

**Grant (NIH/NSF):**
- Add: human-subjects / IRB language if applicable
- Add: data management plan
- Add: facilities & resources statement
