# ASEMA Strategic Analysis Thread — 2026-04-28

**Opportunity:** DARPA SBIR 25.4 Topic R12 — Assessing Security of Encrypted Messaging Applications (ASEMA)
**Topic ID:** HR0011SB20254-12
**Proposer:** Latent Space LLC (DBA Komatik) · UEI XHM9MQFR5VC9 · SDVOSB
**Outcome:** Withdraw. Redirect to NASA SBIR 26-27 Appendix 2026A (Vector) + NIWC Pacific SBSO outreach.
**Participants:** David (PI), Strategist (external), Koda (dev review)
**Date:** 2026-04-28 / 2026-04-29

---

## 1. Koda initial review of ASEMA Vol 3 / Vol 5 draft

### TL;DR

The draft is professionally written but you're chasing the wrong topic with the wrong PI narrative. The fresh SDVOSB unlocks faster, better-aligned paths than DARPA HR0011SB20254-12. Submit ASEMA only if you can find a credentialed crypto co-PI in 10 days; otherwise redirect to Vector-aligned aeronautics SBIRs and SDVOSB sole-source. Wire Base Camp to make this a recurring capability, not a one-shot Markdown file in Downloads.

### What works in the draft

- Vol 3 is DCAA-defensible. Provisional rate language is correct, 14.2% subcontracting under the 33% cap is correct, fee at SBIR 7% cap is correct, fringe split is reasonable.
- 632 PI hours / 61% direct-charge ratio reasoning in §3.2 is the right honest-small-business posture for reviewers.
- Vol 5 §5.3 (SBIR Phase III sole-source + SDVOSB layered authority framing) is the correct structural framing — that's the real asset of this whole package.
- Gap checklist is realistic about authorship holes instead of papering over them.

### What's broken

1. **PI ↔ topic credibility gap.** ASEMA is cryptographic protocol analysis. PI bio is Navy AC1 (air traffic controller). The "Trace methodology = ontology over crypto literature, not original cryptography" pivot is clever but doesn't fully escape it. A 10% LOE SME does not anchor the technical credibility a DARPA reviewer panel needs in 30 seconds.
2. **Vol 2 §6 PI bio = `[NEEDS DAVID INPUT]`.** That section is the entire technical-credibility leg. Empty at v1 is fine. Empty at v3 is a kill shot.
3. **Solo PI + 10% SME is thin for DARPA.** Not NSF-thin, DARPA-thin.
4. **No LOIs (Vol 5 §5.5).** Honest, but reviewers ding it.
5. **Cost mismatch across volumes** (Vol 2 ~$188,855 vs Vol 3 $188,962). Minor but symptomatic — fix at v2.
6. **PI bandwidth math.** 632 ASEMA hours over 6 months while you operate Komatik core + ~10 satellite products + Base Camp's 21-agent fleet. Reviewers know what running a small business looks like; this raises the same flag §3.2 tries to defuse, but worse.
7. **Gap #2 is now closed** — SAM.gov SDVOSB visibility happened. Update Vol 5 §5.3 to remove the `[CONFIRM]` and replace with a hard date and SAM UEI confirmation.

### Strategic alternatives


| Path                                                     | Why it fits                                                                           | Cycle                   | Action                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------- |
| **Vector → FAA / NASA Aeronautics SBIR**                 | 15 yrs military ATC PI bio + working ARTCC simulation with live ADS-B = textbook fit. | 4–6 mo                  | Watch FAA SBIR + NASA SBIR Aeronautics solicitations |
| **Base Camp → DARPA / AFRL agentic-systems BAAs**        | 21-agent autonomous fleet, multi-agent coordination, observability.                   | 8–12 wk for white paper | DARPA I2O + AFRL/RI BAAs                             |
| **SDVOSB sole-source ($4.5M services cap, FAR 19.1406)** | No proposal, no competition.                                                          | Weeks                   | VA VIP registration; NIWC Pacific warm intros        |
| **Direct agency BAA white papers**                       | 10–15 pp, faster cycle.                                                               | 3–6 wk per pass         | AFRL/RI, ONR Code 31, ARL HRED                       |


### Systems recommendation

Wire grant-finding into the agent fleet: grants-specialist agent + capabilities.json + LOI pipeline in Herald + parameterized cost-volume template + single canonical PI bio.

---

## 2. Strategist response — first pass

### Where Koda was right

- PI↔topic credibility gap is real — underweighted by strategist
- Vector / FAA-NASA aeronautics path is a much better PI fit
- SDVOSB sole-source as parallel decoupled track is correct
- Systems recommendation (wire into agent fleet) is the most important thing in the memo

### Where Koda was partly wrong

- Named SME at 10-15% LOE ≠ co-PI; lower bar to clear in 10 days
- Withdraw-and-harvest EV cost not calculated: $200K × 18% × 1.5 SDVOSB ÷ 30 hrs = $1,800/hr
- Cost-mismatch criticism was double-counted (already in cross-volume reconciliation notes)
- PI bandwidth fix lives in §6 bio scoping, not more cost-volume math

### Key insight

capabilities.json ↔ PI bio coupling is the actual unlock — one system, not two separate template assets. The grants-specialist agent does the join: `(opportunity, capability_id) → 70%-complete Vol 2 §1 + §6 + §10`.

### Concrete recommendation

1. ASEMA: switch from co-PI to named-SME track. May 8 decision date.
2. Open Vector-track in parallel, starting Wednesday.
3. NIWC Pacific SBSO outreach within 14 days.
4. Build sequence: PI bio + capabilities.json first → grants agent → Herald-for-LOIs.

---

## 3. Koda second-pass review

### Concessions

1. Named SME at 15% LOE > co-PI — binary framing was wrong
2. Vector-track and ASEMA aren't in tension — conflated
3. Cost mismatch already in cross-volume notes — double-counted
4. PI-bandwidth fix lives in §6 bio scoping — sharper than my analysis
5. capabilities.json + PI bio = one system — correct architecture
6. Herald LOI guardrail — human approval on first outbound — agree
7. Build sequence discipline — agree
8. NIWC underweighted — agree

### EV math correction

- Strategist's 30-hr denominator wrong → 60-80 hrs realistic
- DARPA SDVOSB lift is 1.2× not 1.5× (technical-merit-first)
- Recomputed ASEMA EV: ~$285/hr
- Recomputed NIWC SBSO EV: $15K–$75K/hr
- Gap: ~50–250× in NIWC's favor

### Named-SME operational risk

5–7 candidate reaches needed, each requiring: draft read, signed LoC, institutional conflict checks. 1–2 yeses out of 5–7 if outreach starts by Wednesday. Outreach must begin by Thursday EOD or May 8 is not a real date.

### Gap #0 — the R12 SOW re-read

Neither strategist nor Koda had verified the topic SOW independently. If the SOW excludes defender-tooling, named-SME doesn't fix it. **Re-read SOW before any SME outreach.**

---

## 4. Strategist — SOW re-read findings (DECISIVE)

### Finding #1: ASEMA is Direct-to-Phase-II only

"This is a Direct to Phase II (DP2) solicitation. Therefore, Phase I proposals will not be accepted or reviewed." — DARPA FAQ Q23

The entire proposal pack was structured for a Phase I that does not exist. Komatik does not have Phase-I-equivalent prior work for DP2 eligibility.

### Finding #2: Crypto-protocol analysis is explicitly excluded

"Cryptographic protocols used by secure messaging applications (SMAs) are already well-understood and well-tested security properties, and therefore not the focus of this effort." — DARPA FAQ Q1

The actual ask: dynamic binary analysis, static reverse-engineering, fuzzing frameworks against SMA binaries. Not literature synthesis, not ontology over published cryptography.

### Impact

Both prior critiques become structurally correct in a stronger sense than either argued. The proposal isn't "defensible with a named SME upgrade." It's not eligible to submit and is mis-positioned.

- ASEMA EV with named SME: **$0/hr** (not eligible)
- ASEMA EV without named SME: **$0/hr** (same reason)
- Vector → FAA/NASA SBIR: still strong
- NIWC Pacific SBSO: still highest near-term EV ($15K–$75K/hr)

### Three process failures (strategist's)

1. Drafted before re-reading the SOW and FAQ
2. Failed to flag DP2-vs-Phase-I distinction from 9 sessions prior
3. Should have asked the gap #0 question before either prior memo

### Recommendation

Withdraw ASEMA now. Harvest artifacts. Redirect to Vector + NIWC tracks.

---

## 5. Calendar resolution

### NASA SBIR FY26-27 — closes May 21, 2026 (23 days)

Phase I up to $225K, 6 months. Aeronautics subtopics matching Vector:

- "Technologies that improve the safety, efficiency, and management of airspace operations" — **direct hit**
- eVTOL / AAM test capabilities
- Flight-test measurement technologies

Technical questions deadline: May 5, 2026 5:00 PM ET.

### DoD SBIR 26.1 R1 — opens May 6, closes June 3, 2026

Topics drop May 6. NAVAIR + AFRL aviation topics most likely fit. Watch event.

### Year-round BAA paths

- AFRL/RI FY27 white papers due Sep 2, 2026
- AFRL AFAR BAA (Base-Camp-aligned)
- DOT Volpe Center (requires sponsor)
- ONR Code 31

---

## 6. David authorization

ASEMA: withdraw and harvest. Both failure modes sufficient independently.

Single-artifact-pair start: capabilities.json + pi-bio.md in cairn, capability_id as join key.

Architectural gate is the durable lesson. 5-step parse pipeline goes in the grants-specialist agent spec.

---

## 7. Scaffold delivery + extraction

Strategist delivered zip with 11 files, 1,598 lines. Extracted by Koda to `cairn/proposals/` (renamed from `komatik-yggdrasil/proposals/`).

### Corrections on extraction


| Field                        | Claimed                                            | Actual                                                   | Status           |
| ---------------------------- | -------------------------------------------------- | -------------------------------------------------------- | ---------------- |
| `sow-parse.json` topic_title | "Adaptive Secure Encrypted Messaging Architecture" | "Assessing Security of Encrypted Messaging Applications" | Corrected        |
| `sow-parse.json` topic_id    | "SB254-R12"                                        | "HR0011SB20254-12"                                       | Corrected        |
| `sow-parse.json` faq_url     | Specific DARPA URL                                 | Unverified plausible-pattern                             | Marked [CONFIRM] |


### Recurring pattern

Same failure mode across engagement: **high-quality structure + plausible-pattern factual content where primary-doc verification was warranted.** Applied to ASEMA drafting (~40 hrs lost), scaffold path reporting (pre-rename paths), and seed test case factual fields (training data for future agent).

---

## Final decision record

**ASEMA:** Withdrawn. Two independent disqualifiers:

1. Gate-0: DP2-only (FAQ Q23) — Komatik has no qualifying Phase-I-equivalent prior work
2. Gate-1: Crypto-protocol analysis explicitly excluded (FAQ Q1) — proposal anchored on excluded use-case

**Redirected to:**

1. NASA SBIR 26-27 Appendix 2026A — lead Vector strike, May 21 close
2. NIWC Pacific SBSO outreach — Thursday, decoupled from SBIR pipeline
3. DoD SBIR 26.1 R1 — watch, topics drop May 6
4. AFRL/RI FY27 white papers — Q3 hedge

**Reusable artifacts in `cairn/proposals/`:**

- `capabilities.json` + `pi-bio.md` + `rates.yaml` (source-of-truth triple, capability_id as join key)
- `templates/cost-volume-phase1.md` (parameterized from Vol 3)
- `templates/sdvosb-phase3-framing.md` (verbatim reusable from Vol 5 §5.3)
- `templates/commercialization-channels.md` (structure reusable from Vol 5 §5.2)
- `templates/gap-checklist-template.md` (discipline tool)
- `archive/asema-2026-04/sow-parse.json` (seed failing-case for grants-agent gate pipeline)

**Build queue (post-proposal-cycle):**

1. Grants-specialist agent v1 with SOW/FAQ-parse hard gates
2. Herald LOI workflow with first-N-messages human-approval calibration

**Source of truth:** `cairn/proposals/`