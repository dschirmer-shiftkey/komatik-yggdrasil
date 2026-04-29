# Scaffold Review — Koda extraction audit

**Date:** 2026-04-29
**Reviewed by:** Koda
**Source:** `komatik-yggdrasil-scaffold-2026-04-29.zip` (strategist delivery)
**Destination:** `cairn/proposals/` (renamed from `komatik-yggdrasil/proposals/`)

---

## Delivery verification

Strategist reported "Tonight's scaffold — done" with 11 files, 1,598 lines in `komatik-yggdrasil/proposals/`. Initial filesystem check found zero files on disk — scaffold was delivered as a zip in Downloads, not written to any repo.

Zip contents confirmed: 11 files, 1,598 lines. Extracted to `cairn/proposals/` by Koda. JSON and YAML files validated (parse clean).

---

## File inventory (post-extraction)

| File | Lines | Purpose | Quality |
|---|---|---|---|
| `capabilities.json` | 126 | Source of truth — vector, base_camp, trace capabilities | Strong schema, [CONFIRM] tags well-placed |
| `pi-bio.md` | 91 | PI biographical paragraphs by paragraph_id | Good structure, full + compact versions |
| `rates.yaml` | 157 | Labor / fringe / indirect / fee / direct-charge / ODC | Thorough, all provisional flags present |
| `archive/asema-2026-04/vol2_v1.md` | 287 | Dead content, archive value only | Preserved as-is |
| `archive/asema-2026-04/vol3_vol5_draft_v1.md` | 290 | Templates harvested from this | Preserved as-is |
| `archive/asema-2026-04/sow-parse.json` | 148 | Seed failing-case for grants-agent | 3 factual errors corrected on extraction |
| `archive/asema-2026-04/retro.md` | 102 | 3-failure post-mortem | Honest, well-structured |
| `templates/cost-volume-phase1.md` | 143 | Parameterized {{TOKEN}} + glossary + checklist | Production-ready template |
| `templates/sdvosb-phase3-framing.md` | 58 | Verbatim reusable Phase III + SDVOSB framing | Strongest single reusable artifact |
| `templates/commercialization-channels.md` | 98 | Structure-only, content per-proposal | Good framework, includes per-capability guidance |
| `templates/gap-checklist-template.md` | 102 | Discipline tool for proposal gap tracking | Includes categories, hygiene rules, per-type variants |

**Additional directories created by strategist (empty, not in report):**
- `active/` — intended for per-proposal working dirs
- `opportunities/` — intended for parsed opportunity records

---

## Corrections applied on extraction

### 1. `sow-parse.json` topic_title (CORRECTED)

- **Claimed:** "Adaptive Secure Encrypted Messaging Architecture (ASEMA)"
- **Actual:** "Assessing Security of Encrypted Messaging Applications (ASEMA)"
- **Source:** `archive/asema-2026-04/vol2_v1.md` line 3 and `vol3_vol5_draft_v1.md` line 3
- **Risk:** This is the seed test case for the future grants-agent. Hallucinated topic title in training data would propagate the error.

### 2. `sow-parse.json` topic_id (CORRECTED)

- **Claimed:** "SB254-R12"
- **Actual:** "HR0011SB20254-12"
- **Source:** Same archive documents
- **Risk:** Same as above — agent training data.

### 3. `sow-parse.json` faq_url (MARKED [CONFIRM])

- **Claimed:** `https://www.darpa.mil/sites/default/files/attachment/2025-12/faq-hr0011sb20254-12-4.pdf`
- **Status:** Plausible URL pattern, not independently verified by strategist or Koda
- **Action:** Marked `[CONFIRM]` with explanatory note. David to verify against DARPA SBIR portal before this record seeds the grants-agent test set.

### 4. `_meta.parser` field updated

- **Was:** "manual (David + strategist re-read)"
- **Now:** "manual (strategist scaffolded; koda corrected hallucinated topic_title and unverified faq_url on extraction to cairn/proposals/)"
- **Reason:** Audit trail for extraction corrections.

### 5. `_meta.extraction_corrections[]` added

New array documenting all three corrections with rationale. Ensures the audit trail survives.

---

## Issues flagged (NOT fixed — require David input)

### `_archive_capabilities.ids` contains "cairn"

`capabilities.json` line 124 lists `"cairn"` as an archived V4.1 brand-line slug. Now that the proposals scaffold lives inside the `cairn` repo, this is a naming collision. David to decide:
- If "cairn" the repo and "cairn" the archived capability are the same thing: add a note
- If different: rename one

### Decorative `$schema` reference

`capabilities.json` line 2 claims JSON Schema 2020-12 conformance but no schema file exists. Non-blocking; clean up when the grants-agent ships and needs a real schema for validation.

---

## Recurring pattern

Three instances of the same failure mode across this engagement:

| Instance | What happened | Cost |
|---|---|---|
| ASEMA Vol 2 drafting | Proceeded on capability-fit intuition, not primary-doc verification | ~40 hrs dead authoring |
| Scaffold delivery report | Claimed work landed at `komatik-yggdrasil/proposals/` (pre-rename path) | Confusion + verification overhead |
| `sow-parse.json` factual fields | Plausible-pattern content without primary-doc verification, in agent training data | 3 corrections needed on extraction |

Pattern: **high-quality structure + plausible-pattern factual content where primary-doc verification was warranted.**

Architectural fix (applies to strategist, Koda, and future grants-agent equally):
- Every claimed URL → fetched and verified, or marked `[CONFIRM]`
- Every verbatim quote → extracted with line/page citation, or marked `[paraphrase]`
- Every completed-work claim → `ls -la` or `git ls-files` proof in report, not prose assertion

---

## Wednesday AM fact-check queue (priority order)

1. **`rates.yaml`** — every `provisional: true` row. PI hourly $150, fringe 22%, indirect 18%, direct-charge 632/1040. NICRA existence check.
2. **`capabilities.json` TRL fields** — vector / base_camp / trace. Pick a number, list evidence.
3. **`pi-bio.md` operational facts** — years served, facilities, qualifications, agent count, Trace maturity.
4. **`capabilities.json` narrative_paragraph** — [NEEDS DAVID INPUT] on all three. Only authoring owed before NASA gate-parse.
5. **`_archive_capabilities` "cairn" collision** — 1-line decision.
6. **`sow-parse.json` faq_url** — 5-minute DARPA portal verification.
