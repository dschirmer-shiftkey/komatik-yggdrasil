# ASEMA Retrospective — Withdraw and Redirect

**Opportunity:** DARPA SBIR 25.4 Topic R12 — Adaptive Secure Encrypted Messaging Architecture (ASEMA)
**Decision date:** 2026-04-29
**Outcome:** Withdraw before submission. Redirect to NASA SBIR 26-27 Appendix 2026A.
**Author:** Strategist + David (PI)
**Status:** Final

---

## TL;DR

ASEMA was disqualified on two independent grounds, either of which alone would justify withdraw:

1. **Gate-0 (phase eligibility):** R12 is DP2-only (FAQ Q23). Komatik does not have qualifying Phase-I-equivalent prior work.
2. **Gate-1 (scope exclusion):** R12 explicitly excludes cryptographic-protocol focus (FAQ Q1). The drafted pitch anchored on Signal Protocol forensics — a direct intersection with the named exclusion.

The drafts (`vol2_v1.md`, `vol3_vol5_draft_v1.md`) were written before either FAQ was re-read in detail. Both gates were findable on a first careful pass through the FAQ document. They were missed.

---

## What went wrong (process)

### Failure 1: drafted before re-reading the SOW + FAQ

The R12 SOW was last read in detail when the topic landed; the FAQ was read on initial publication and not re-read before drafting Vol 2 and Vol 3/Vol 5. The DP2-only constraint and crypto-protocol exclusion were both in the FAQ. Drafting work proceeded on capability-fit intuition rather than current scope verification.

**Cost:** ~40 hours of Vol 2 + Vol 3/Vol 5 authoring effort that does not transfer to the next opportunity (the cost narrative and SDVOSB framing transfer; the technical-volume content does not).

### Failure 2: capability-fit framed the pitch into the excluded zone

Trace is a legitimate audit-tooling capability. The pitch took Trace and anchored it on cryptographic-protocol forensics as the application — pulling a valid capability into an excluded use-case. This is a framing failure, not a capability failure. The capability stays. The framing dies.

**Lesson:** future opportunity parses must check `proposed_pitch.anchored_on` against `scope_exclusions`, not just `capability.tags` against `scope_inclusions`. A capability can be in scope and still be applied out of scope.

### Failure 3: no gate-pass discipline

There was no documented gate-0 / gate-1 check before authoring began. This is now corrected: the future grants-specialist agent will hard-gate every opportunity through 5 steps (fetch SOW → fetch FAQs → parse → match → output go/no-go) before any drafting. The ASEMA `sow-parse.json` is the seed failing-case test for that pipeline.

---

## What got harvested (transferable assets)

Despite the withdraw decision, the ASEMA drafts produced reusable templates. These migrate to `../templates/` and become the baseline for the NASA Appendix 2026A scaffold and beyond.

| Source | Disposition | Destination |
|--------|-------------|-------------|
| `vol3_vol5_draft_v1.md` §3.1 Cost summary | parameterize | `templates/cost-volume-phase1.md` |
| §3.2 Direct labor — PI | parameterize | same |
| §3.3 Subcontractors | parameterize (low-content scaffold) | same |
| §3.4 Other direct costs | parameterize | same |
| §3.5 Indirect costs | parameterize | same |
| §3.6 Fee | parameterize | same |
| §3.7 Cost narrative — risks and mitigations | structure reusable | same |
| §3.8 Cost realism statement | structure reusable | same |
| §5.2 Path A-E commercialization | structure reusable, customer-fit per-proposal | `templates/commercialization-channels.md` |
| §5.3 Phase III contract pathway and SDVOSB advantage | verbatim reusable | `templates/sdvosb-phase3-framing.md` |
| 18-item gap checklist pattern | structure reusable | `templates/gap-checklist-template.md` |
| Vol 2 §1-§11 (Signal Protocol-anchored content) | DEAD — do not reuse | n/a (preserved here for archive value only) |

**Net transfer:** Vol 3 entirely, Vol 5 §5.2-§5.3 entirely, gap-checklist pattern. Vol 2 is dead.

---

## What got dropped

- **Signal Protocol layer pitch** — anchored on a scope-excluded use case. Do not revive for any DARPA messaging topic without verifying that topic's exclusion list.
- **Cryptographic-protocol forensics framing for Trace** — the framing, not the capability. Trace remains in `capabilities.json` with audit-graph methodology framing. Future Trace pitches must avoid protocol-level framing unless the target topic explicitly invites it.
- **DARPA SBIR 25.4 R12 as an immediate strike target** — moved to Dead List in `grant_tracker_v2.xlsx`.

---

## What changed in process (commitments)

1. **Gate-0/gate-1 SOW parse is now a required step before any authoring on any opportunity.** Output is `sow-parse.json` in the opportunity's working directory. ASEMA `sow-parse.json` is the seed failing-case test for the future agent.

2. **Capability framing check** is added to gate-1: not just capability tags vs. inclusions, but proposed_pitch anchor vs. exclusions. The lesson is that a valid capability + an invalid framing = a non-responsive proposal.

3. **FAQs are part of the primary doc set.** Treat FAQ documents at the same priority as the SOW itself for gate parsing. Re-read both before drafting and before submission.

4. **NASA SBIR 26-27 Appendix 2026A is the new lead Vector strike.** Submission target: 2026-05-21 17:00 ET, with author-complete by 2026-05-18 (3-day reserve). Tech-questions deadline 2026-05-05 17:00 ET.

5. **NIWC Pacific SBSO outreach goes Thursday 2026-05-01**, decoupled from the SBIR work. EV $15K-$75K/hr per dev's recompute.

---

## Archive contents

- `vol2_v1.md` — Vol 2 technical volume draft (Signal Protocol anchored, **DEAD content**, archive value only)
- `vol3_vol5_draft_v1.md` — Vol 3 cost narrative + Vol 5 commercialization (templates harvested from this; original preserved)
- `sow-parse.json` — structured post-mortem parse, seed failing-case test for future grants-agent
- `retro.md` — this file

## Calibration markers

- ~40 hours authoring effort lost to no-gate-check
- 2 independent disqualifiers found by careful FAQ re-read in ~30 minutes
- ROI of gate-pass discipline: ~80x on this single opportunity. The agent investment pays back on the first prevented dead-pursuit.

---

*Archived 2026-04-29. No further action on this opportunity. Reference for grants-agent v1 training data.*
