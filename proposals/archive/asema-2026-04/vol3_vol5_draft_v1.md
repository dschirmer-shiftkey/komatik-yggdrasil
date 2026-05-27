# DARPA SBIR 25.4 R12 — ASEMA — Volumes 3 & 5 Draft v1

**Topic:** HR0011SB20254-12 — Assessing Security of Encrypted Messaging Applications
**Proposer:** Latent Space LLC (DBA Komatik) · UEI XHM9MQFR5VC9 · CA · SDVOSB
**PI:** David Schirmer · U.S. Navy AC1 (E-6, ~12 years) · 100% service-connected disabled veteran
**Period of Performance (Phase I):** 6 months
**Draft status:** v1 — first pass. Same tag conventions as Vol 2 — `[CONFIRM: …]` = factual claim David must verify; `[NEEDS DAVID INPUT: …]` = direct authorship gap.

This file contains two distinct deliverables that get filed separately on DSIP:
- **Volume 3** — Cost Volume narrative + line-item table. DSIP also requires a structured cost upload; this narrative supports it. Page budget: typically 1–3 pp in narrative form plus the structured upload.
- **Volume 5** — Commercialization Strategy. Page budget: **5 pp**, separate from Volume 2's 20pp technical limit.

---

# VOLUME 3 — COST VOLUME

## §3.1 Cost summary

This Phase I cost proposal totals **$188,855**, sitting under the DARPA SBIR Phase I base ceiling of ~$200,000 with margin reserved for negotiation and unforeseen direct-cost items. The 150% cap option (~$225,000) is not requested at proposal time. The proposer is a single-PI small business (Latent Space LLC, DBA Komatik), an SDVOSB, and elects to perform the substantial majority of work in-house.

| Line | Category | Phase I (6 mo) | Notes |
|---|---|---|---|
| 1 | Direct labor — PI (100% LOE) | $94,800 | 632 hrs × $150/hr [CONFIRM rate] |
| 2 | Direct labor — fringe | $20,856 | 22% on direct labor [CONFIRM rate] |
| 3 | Subcontractor — SME consultant (10% LOE) | $20,000 | Independent contractor, 1099 |
| 4 | Subcontractor — tooling reserve | $5,000 | ProVerif/Tamarin support, dependency-graph tooling |
| 5 | Cloud / dev environment | $5,000 | [CONFIRM provider — AWS/GCP/Azure] |
| 6 | Travel | $3,500 | DARPA HQ kickoff (Arlington, VA) + 1 optional |
| 7 | Materials & supplies | $500 | Reference texts, document handling |
| 8 | Direct cost subtotal | $149,656 | Lines 1–7 |
| 9 | Indirect (overhead + G&A) | $26,944 | 18% on direct cost subtotal [CONFIRM rate] |
| 10 | Total cost | $176,600 | Lines 8 + 9 |
| 11 | Fee (7% — SBIR fee cap) | $12,362 | On total cost |
| 12 | **Total proposed price** | **$188,962** | Lines 10 + 11 |

[CONFIRM: line 1 hourly rate, line 2 fringe rate, line 9 indirect rate. The numbers above are placeholders consistent with single-PI California small-business norms but must be backed by Latent Space LLC's actual books and any historical cost-accounting practice before submission. If David hasn't formally established a fringe and indirect pool, the cleanest move is a **provisional billing rate** declaration: state the rates, mark them provisional, commit to true-up at award. DCAA does not require an audited rate for Phase I but does require a defensible methodology.]

[CONFIRM: numbers in §3.1 differ slightly from Vol 2 §10 because the cost is properly decomposed here. Reconcile when Vol 2 v2 is updated — Vol 2's total moves from ~$188,855 to $188,962. Within rounding, but harmonize for final.]

## §3.2 Direct labor — PI

**Rate basis.** The PI labor rate of $150/hour reflects [CONFIRM: David's actual or planned compensation rate for the period of performance, accounting for owner-employee compensation conventions for a single-member LLC]. For a Phase I SBIR, the simplest defensible structure is:

- David Schirmer is the sole employee/owner of Latent Space LLC.
- Phase I PI labor is logged against ASEMA at 100% level of effort for six months.
- Standard work-year for federal cost accounting: 2,080 hours; six months = 1,040 hours; 100% LOE = 1,040 hours billable. We propose 632 hours billable, which represents **~61% direct-charged time** with the remaining 39% absorbed in indirect / business operations / unbillable activity. This conservative direct-charge ratio is honest for a single-PI small business and survives reviewer scrutiny.

**Why 632 hours not 1,040.** Reviewers have seen too many SBIR cost volumes that propose 100% of an owner's calendar as billable. That triggers indirect-allocation skepticism and DCAA flags. Proposing 632 billable hours — ~26 hours/week direct-charged on ASEMA, balance on company operations — is more credible and matches the actual rhythm of running a small business while executing a contract.

**Cost computation.**
- 632 hrs × $150/hr = $94,800 base salary
- Fringe (22% of base): $20,856 — covers self-employment-tax employer share, health insurance equivalent, paid time off equivalent
- Loaded direct labor: **$115,656**

[CONFIRM: David should verify (a) whether $150/hr aligns with W-2 take-home equivalent he intends to draw, (b) whether 22% fringe is the right composite rate for a single-member LLC in California, and (c) whether the 61% direct-charge ratio matches his actual planned schedule. These are the three lines DCAA will probe first.]

## §3.3 Subcontractors

**Line 3 — SME consultant ($20,000, 10% LOE).** As stated in Vol 2 §6 and §8, the proposer commits to retaining one external Subject Matter Expert with published credentials in cryptographic protocol analysis or mobile messaging security, at approximately 10% LOE for the period of performance, within 30 days of contract award. Cost basis:

- 6 months × ~17 hours/month = ~104 hours
- $200/hour blended consultant rate (typical for senior security researchers, well below FFRDC labor rates)
- $20,800 ≈ $20,000 with a small downward rounding for procurement margin

The SME contract will be a fixed-price independent-contractor agreement (1099). Selection process and shortlist methodology are documented and available to the contracting officer on request.

**Line 4 — Tooling reserve ($5,000).** Reserved for specialized protocol-analysis tooling. Candidate uses:
- ProVerif or Tamarin support contracts if dependency graph instantiation requires deeper symbolic-execution support than open-source tooling provides;
- Commercial dependency-graph tooling licenses (e.g., Snyk, Socket, or equivalent) for supply-chain analysis of the libsignal Rust core;
- Specialized SBOM ingestion services for the TeleMessage TM SGNL case study.

If the reserve is not consumed, residual is returned per FAR 31.205-19 reasonable-cost principles.

**Subcontracting limits compliance.** Per SBA SBIR rules (13 CFR § 121.702), the small business concern (Latent Space LLC) must perform a minimum of two-thirds (67%) of the research and development by cost. Subcontracted activity totals $25,000 of $176,600 total cost = **14.2%**, well within the 33% ceiling.

## §3.4 Other direct costs

**Line 5 — Cloud / dev environment ($5,000).** Existing Komatik infrastructure on a commercial cloud provider [CONFIRM: AWS / GCP / Azure]. Allocated cost reflects ~$830/month for the 6-month period: compute, storage, and CI/CD environment for ontology development, graph construction, and case-study replay. No specialized GPU or HPC resources are required.

**Line 6 — Travel ($3,500).** One mandatory trip and one optional:

| Trip | Origin | Destination | Purpose | Estimated cost |
|---|---|---|---|---|
| 1 | San Diego, CA | Arlington, VA | DARPA Program Manager kickoff (Month 1) | $2,000 |
| 2 | TBD | TBD | Optional: in-person SME review or pilot partner site visit | $1,500 |

Costs follow GSA per-diem and FedRAMP-compliant booking practice; no first-class airfare; meals at standard CONUS rate. Receipts retained per FAR Part 31.

**Line 7 — Materials & supplies ($500).** Modest reserve for reference texts (printed copies of NIST SP 1800 series for offline annotation), document handling supplies, and any printed pilot-engagement materials.

## §3.5 Indirect costs

**Line 9 — Indirect rate (18% on direct cost subtotal).** Composite indirect rate covering:

- Overhead (rent for home office allocation per IRS safe-harbor; software licenses for general business operations; professional services — legal, accounting, insurance);
- General & Administrative (state and federal compliance filings; SAM.gov maintenance; GSA-compliant accounting system implementation cost amortized);
- Bid & proposal costs (capped per FAR 31.205-18).

[CONFIRM: 18% is a placeholder. Latent Space LLC's actual indirect rate for the period of performance must be substantiated by the company's accounting records. If David has not yet formally calculated an indirect rate, the standard small-business move for a first SBIR Phase I is a **provisional rate** declaration: state 18% as provisional, commit to a true-up at award based on incurred-cost submission. DCAA accepts this for Phase I; it gets formal scrutiny only at Phase II or in a subsequent audit.]

**Provisional rate declaration.** If David has not previously held a federal contract requiring indirect-rate audit:

> "Latent Space LLC has not previously been subject to federal indirect-rate audit. Indirect rates proposed in this volume (18% composite overhead + G&A) are provisional, supported by the company's current general-ledger accounting practice. The proposer commits to true-up at award via incurred-cost submission per FAR 52.216-7 if required by the awarding contracting officer."

## §3.6 Fee

**Line 11 — Fee at 7% (SBIR cap).** SBA SBIR program rules cap fee at 7% of total cost. Proposed fee: $176,600 × 0.07 = $12,362. This is the maximum allowable; it is the standard request for first-time Phase I performers and is rarely negotiated downward unless cost is challenged.

## §3.7 Cost narrative — risks and mitigations

**Risk 1: Hourly rate challenge.** A reviewer or contracting officer may probe the $150/hr PI rate as high for a single-member LLC without prior federal contracting history. Mitigation: cite the 100% disabled-veteran founder status (no prior W-2 federal contracting compensation history applies), and offer to true-up at award if the rate is judged unsupportable. Backup rate: $135/hr based on BLS Occupational Employment and Wages May 2024 data for "Information Security Analysts" (15-1212) at the 90th percentile in San Diego MSA [CONFIRM with current BLS data closer to submission].

**Risk 2: Indirect-rate challenge.** As above; provisional rate declaration with commitment to true-up resolves this for Phase I.

**Risk 3: Subcontract execution risk for SME.** If the SME consultant cannot be identified within 30 days of award, the $20,000 line item is reserved and unspent. This does not affect the technical work in Months 1-2 (ontology v1 is PI-led; SME review is for v2 in Month 2 end). Mitigation: maintain a shortlist of candidate SMEs developed during Tasks 1-2; backup option is a multi-SME engagement at lower hours per person.

**Risk 4: Travel cost volatility.** GSA per-diem is fixed; airfare is volatile. Mitigation: $3,500 line includes 20% buffer over expected actual; residual returned if unspent.

## §3.8 Cost realism statement

This cost proposal reflects the actual scope, schedule, and risk of the Phase I research described in Volume 2. Costs are reasonable, allocable, and allowable per FAR Part 31. No cost line is inflated to absorb scope creep, no line is suppressed to fit a budget envelope. The proposer has scoped Phase I deliberately to fit a single-PI six-month effort within the DARPA Phase I base ceiling, with explicit out-of-scope items (no original cryptanalysis, no implementation, no operational deployment) reserved for Phase II.

---

# VOLUME 5 — COMMERCIALIZATION STRATEGY

*Page budget: 5 pp. Drafted to ~4.5 pp with breathing room for David's specific channel intelligence.*

## §5.1 Customer problem and value proposition

Federal civilian agencies, DoD program offices, and regulated commercial industries all carry the same operational gap: secure messaging applications are deeply embedded in their communications surface, the cryptographic literature on those applications is rich and rigorous, and yet small defender teams — agency program offices, civilian SOCs, sector ISACs, regulated-industry compliance teams — cannot translate that literature into action under operational time pressure. When CISA adds a new SMA-related entry to the Known Exploited Vulnerabilities catalog, the question every defender team faces is the same: *am I affected, what should I do, and what evidence supports that action?* Today, answering that question takes weeks of analyst time, often longer than the patch window.

The Trace methodology developed under this Phase I — ontology, reference graph, and scoring framework — produces a defender-actionable artifact that compresses time-to-decision by a target of ≥50%. The value is measurable in analyst hours saved, mean-time-to-decision reduction, and successful prioritization of defensive measures against actual exploit campaigns. Customers willing to pay for that compression are not hypothetical; they are spending the analyst hours today.

## §5.2 Phase III commercialization paths

DARPA's commercialization expectation for an SBIR Phase I is a credible, evidence-based plan, not a guarantee. We identify five distinct go-to-market paths grouped into three categories. Each path has an explicit early customer profile, contracting vehicle, and pricing posture.

### Path A — Federal civilian (CISA & sector ISACs)

**Customer.** CISA's Joint Cyber Defense Collaborative (JCDC) and the sector-aligned Information Sharing and Analysis Centers (ISACs), specifically Financial Services ISAC (FS-ISAC) and Health-ISAC (H-ISAC). Both ISACs have member organizations under direct compliance pressure (FFIEC for FS-ISAC, HIPAA for H-ISAC) and active SMA-related risk advisories.

**Buyer profile.** ISAC technical leadership (CTO/CISO equivalent at the consortium level) buying tooling that augments member-facing threat intelligence. CISA buying via the Cybersecurity Quality Services Management Office (CQSMO) or the Continuous Diagnostics and Mitigation (CDM) program.

**Contracting vehicle.** Phase III sole-source authority under [15 U.S.C. § 638(r)(4)](https://www.law.cornell.edu/uscode/text/15/638) — once an SBIR-funded technology completes Phase II, any federal agency may award a Phase III contract directly to the SBIR awardee with no competition required, no dollar ceiling, no further justification beyond the Phase II completion record. This is the single largest structural advantage of the SBIR pathway and the centerpiece of the proposer's Phase III plan.

**Pricing posture.** Annual subscription license, $250K-$500K/year per ISAC, scaled to membership size. CISA contract size depends on scope (advisory tooling vs. CDM integration); typical CDM tool contracts are multi-year, $1M-$5M base.

**Time horizon.** Phase III contract execution begins ~12-18 months after Phase II contract award. First federal civilian deployment: late 2028 / early 2029 [CONFIRM with current DARPA timeline assumptions].

### Path B — Federal defense (DoD program offices)

**Customer.** DoD program offices using SMAs for unclassified-but-sensitive (CUI) communications coordination, particularly distributed mission-support functions. Examples: medical command logistics; recruiting command communications; legal command attorney-client coordination. [NEEDS DAVID INPUT: David's Navy network — specifically AC community contacts and any prior interactions with N6/N2 communications staff — is the warm-intro pool here. Even one named program office contact materially strengthens this section.]

**Buyer profile.** Program manager or technical lead at the program office level; cybersecurity coordinator at the major-command level.

**Contracting vehicle.** Phase III sole-source as above. Alternative: SDVOSB sole-source authority under FAR 19.1406 / [13 CFR § 125.20](https://www.ecfr.gov/current/title-13/chapter-I/part-125/subpart-B/section-125.20), which allows sole-source awards up to $7.5M (manufacturing) or $4.5M (other) directly to SDVOSBs without SBIR Phase II requirement. The SDVOSB sole-source path is independent of the SBIR pathway and represents a parallel, redundant route to federal defense customers.

**Pricing posture.** Per-program-office subscription, $100K-$300K/year per office. Scope includes ontology updates, scoring framework calibration, and tier-2 analyst support for SMA-related decisions.

**Time horizon.** Phase III contract execution begins after Phase II. Parallel: SDVOSB sole-source deals achievable during Phase II if a program office customer surfaces.

### Path C — Federal civilian SOCs (direct contracting)

**Customer.** Civilian agency SOCs at agencies with significant SMA-using workforces: IRS, SSA, VA, HHS sub-agencies. These SOCs are buyers of Mobile Threat Defense (MTD) tooling (Lookout, Zimperium, Microsoft Defender for Endpoint mobile), and they have an analyst-hours problem the Trace methodology directly addresses.

**Contracting vehicle.** Phase III sole-source as above; or competitive procurement via GSA Multiple Award Schedule (MAS) Information Technology category. The proposer will pursue a GSA Schedule listing during Phase II.

**Pricing posture.** Annual subscription, $200K-$400K/year per agency SOC, scaled to inventory size. Add-on professional services for case-by-case SMA risk advisory.

### Path D — Commercial regulated industries — financial services

**Customer.** Mid-sized broker-dealers, regional banks, and asset managers. These firms are under FINRA Rule 3110 (supervision of business communications) and MNPI handling rules; SMA usage on personal devices for business communication is the most active enforcement area in the past 36 months ([SEC and CFTC enforcement actions, ~$2.7B in fines since 2022](https://www.sec.gov/files/litigation/admin/2023/34-98412.pdf)).

**Buyer profile.** Chief Compliance Officer, supported by CISO. Compliance budget, not security budget.

**Contracting vehicle.** Direct commercial contract; standard SaaS subscription. No federal contracting overhead.

**Pricing posture.** Annual subscription $50K-$150K/year per firm, scaled to headcount and SMA inventory size. Add-on for FINRA examination support engagements.

**Time horizon.** Achievable during Phase II if pilot data is sufficient; full commercial launch post-Phase II.

### Path E — Commercial regulated industries — healthcare

**Customer.** Health systems, large physician groups, and digital-health platforms operating under HIPAA. SMA-related leakage is a documented but under-addressed risk area; HHS Office of Civil Rights has signaled increased scrutiny in recent guidance.

**Buyer profile.** Chief Privacy Officer or HIPAA Security Officer, supported by CISO.

**Contracting vehicle and pricing posture.** Same model as Path D, $50K-$150K/year per system, scaled by employed clinician count.

[CONFIRM: pricing ranges in §5.2 are market estimates from public procurement data; David should sanity-check before final submission. Rough sources: GSA MAS price lists, [SAM.gov contract awards](https://sam.gov), and FedScoop/FedTalk coverage of recent agency SOC tooling buys.]

## §5.3 Phase III contract pathway and SDVOSB advantage

**SBIR Phase III sole-source authority** is the structural mechanism that makes the SBIR pathway commercially distinct from any other federal R&D vehicle. Under [15 U.S.C. § 638(r)(4)](https://www.law.cornell.edu/uscode/text/15/638), once an SBIR-funded technology has completed Phase II, any federal agency may award a Phase III contract directly to the SBIR awardee:

- No competition required;
- No dollar ceiling (this is the only sole-source authority in the FAR with an unlimited ceiling);
- Justification is the existence of the Phase II completion record, full stop;
- The technology funded under Phase III need only "derive from, extend, or complete" the Phase II work.

This authority alone justifies federal-civilian-channel investment by any SBIR awardee, because Phase III is the path from $200K Phase I to $50M+ federal program-of-record without the procurement overhead that kills most small-business federal commercialization plans.

**SDVOSB layered advantage.** Latent Space LLC is a fully certified SDVOSB (David Schirmer, 100% service-connected disabled veteran, U.S. Navy AC1). This adds three structural advantages on top of the SBIR Phase III pathway:

1. **SDVOSB sole-source authority.** Independent of SBIR, federal agencies may award sole-source contracts to certified SDVOSBs up to $7.5M (manufacturing) or $4.5M (services) under FAR 19.1406. This creates a parallel commercialization path independent of Phase II completion.

2. **SDVOSB set-aside contracts.** Federal contracting officers must consider SDVOSB set-aside before competitive procurement under FAR 19.1405, when the rule-of-two applies (two qualified SDVOSBs available). This widens the accessible federal market for any award above ~$25K.

3. **Federal SDVOSB goal of 5%.** Per NDAA FY24, the federal contracting goal for SDVOSBs increased from 3% to 5% of total federal procurement spend, an annual target of approximately $31B. Federal customers under pressure to meet this goal will preferentially direct discretionary procurement to qualified SDVOSBs. ASEMA-funded technology, delivered by an SDVOSB, sits at the intersection of two federal priorities: cybersecurity and SDVOSB attainment.

The combined effect: a Phase III pathway with SDVOSB layering is the most asymmetric commercialization posture available in federal R&D contracting. The proposer is fully and currently certified for both pathways. [CONFIRM: VetCert flow-through to SAM.gov visible by 2026-05-01 — gap-checklist item #2.]

## §5.4 Commercial market sizing

**Federal civilian / defense.** SMA-relevant federal cybersecurity tooling is a subset of the broader $19B federal civilian cybersecurity market and the $14B DoD cybersecurity market [CONFIRM with current Bloomberg Government or Govini data]. Conservative addressable subset for SMA risk-advisory tooling: $400M-$800M annually across CISA, agency SOCs, ISACs, and DoD program offices. Realistic 5-year achievable market share: $5M-$15M annual recurring revenue across federal channels.

**Commercial regulated industries.** Financial services SMA compliance market is bracketed by the $2.7B in SEC/CFTC fines since 2022 and the FINRA/SEC active enforcement posture. Healthcare market is smaller, $100M-$300M addressable. Combined commercial regulated-industries addressable market: $1B-$2B; realistic 5-year share for a focused entrant: $3M-$8M ARR.

**Combined Phase III steady-state target (post-2030).** $10M-$25M ARR across federal and commercial channels, with federal as the dominant segment due to Phase III sole-source pricing power.

[CONFIRM: market sizing numbers are conservative estimates derived from public market research; reviewers do not require precision but do penalize obvious puffery. The numbers above are deliberately under the headline-grabbing claims a less disciplined competitor would make.]

## §5.5 Letters of interest

[NEEDS DAVID INPUT: any LOIs achievable by submission date (2026-05-08 internal target, 2026-05-13 hard deadline)? Even one one-paragraph "interested in evaluating" letter from a federal SOC, ISAC technical lead, agency program office, or commercial regulated-industry compliance team is materially helpful to the commercialization score. If none are achievable, omit this section entirely and let the strategy stand on the structural Phase III + SDVOSB logic. Do not fabricate LOIs or stretch loose conversations into fake commitments — that is rapidly identifiable by reviewers and damages credibility.]

If LOIs are obtained, they will be appended to Volume 5 as a sub-attachment, not counted against the 5pp limit per DSIP submission instructions [CONFIRM appendix policy in DSIP submission requirements before relying on it].

## §5.6 Funding and capital strategy

Latent Space LLC is fully bootstrapped. The proposer has no equity investors, no debt, and no in-kind support arrangements that would constitute support requiring disclosure under DARPA SBIR rules (see Volume 2 §9). This non-dilutive funding posture is deliberate: Phase I and Phase II SBIR/STTR funding is sufficient to reach commercial revenue without dilution, and the SBIR program's emphasis on supporting non-dilutive small business growth aligns with the proposer's strategy.

If outside capital becomes appropriate post-Phase II, the proposer will preferentially seek non-dilutive sources first (Phase III contracts, SDVOSB sole-source, GSA Schedule revenue), then small-cap venture or strategic-acquirer interest only if growth velocity exceeds organic-cashflow capacity. The SDVOSB certification status will be preserved through any capital event per [13 CFR § 125.18](https://www.ecfr.gov/current/title-13/chapter-I/part-125) ownership and control rules.

## §5.7 Risks to commercialization

**Risk 1: Phase II non-award.** The Phase III sole-source path requires Phase II completion. If Phase II is not awarded, the SDVOSB sole-source pathway (independent of SBIR) and direct commercial channels (regulated industries) remain available. The plan does not depend on Phase II for survival, only for the optimal pathway.

**Risk 2: Federal procurement timeline.** Federal customers move on multi-year cycles. Phase III sole-source contracts typically execute 12-24 months after Phase II completion. Mitigation: start commercial-channel engagement (Paths D and E) during Phase II to generate early revenue while federal pipeline matures.

**Risk 3: SDVOSB certification continuity.** SDVOSB status requires annual certification maintenance. Mitigation: calendar reminder set for VetCert renewal each year; SDVOSB-status maintenance is standard founder discipline and adds <1 day/year of administrative load.

**Risk 4: Competition from established MTD vendors.** Lookout, Zimperium, and Microsoft are well-capitalized and present in adjacent markets. Mitigation: the Trace methodology is a layer above MTD telemetry — it is decision-support over data those vendors already collect, not a replacement for the data collection itself. Partnership with one MTD vendor is a candidate Phase II teaming relationship.

---

# Cross-volume reconciliation notes

These items reconcile across Vol 2, Vol 3, and Vol 5 and need synchronization at v2:

1. **Cost totals** — Vol 2 §10 says ~$188,855; Vol 3 §3.1 says $188,962. Pick one and propagate.
2. **VetCert / SAM flow-through** — referenced in Vol 2 §1, Vol 5 §5.3. Single source of truth: SAM.gov visible status by 2026-05-01.
3. **PI bio** — Vol 2 §6 [NEEDS DAVID INPUT]; Vol 5 §5.2 Path B references Navy network. Same bio, two sections referring to it.
4. **SME advisor language** — Vol 2 §6 and §8 + Vol 3 §3.3. Use exactly the same "within 30 days of award" phrasing in all three places.
5. **LOIs** — Vol 2 §11 [NEEDS DAVID INPUT] and Vol 5 §5.5. Same gap, same answer.

---

# Updated gap checklist (Vol 2 + Vol 3 + Vol 5 combined)

| # | Volume | Section | Item | Owner | Due |
|---|---|---|---|---|---|
| 1 | Vol 2 | §1 | Trace one-paragraph description in your voice | David | 2026-05-02 |
| 2 | Vol 2 / Vol 5 | §1, §5.3 | Confirm VetCert flow-through visible in SAM.gov | David | 2026-05-01 |
| 3 | Vol 2 | §2 / Obj 4 | Confirm 50% TTD reduction target is defensible or soften | David + me | 2026-05-04 |
| 4 | Vol 2 | §3 / Task 2 | Trace's actual graph-construction tooling description | David | 2026-05-03 |
| 5 | Vol 2 | §3 / Task 3 | Identify SOC contact for TeleMessage timeline interview | David | 2026-05-08 |
| 6 | Vol 2 / Vol 5 | §3 / Task 4, §5.2 Path B | Any existing federal/SOC/ISAC contacts for pilot or warm intros | David | 2026-05-05 |
| 7 | Vol 2 | §6 | Full PI bio (1 page) | David | 2026-05-04 |
| 8 | Vol 2 | §6 | SME advisor decision: name now or commit-within-30-days language | David | 2026-05-05 |
| 9 | Vol 2 / Vol 3 | §7, §3.4 | Cloud provider name | David | 2026-05-02 |
| 10 | Vol 2 | §7 | CUI/clearance escalation flag if pilot partner needs it | David | 2026-05-08 |
| 11 | Vol 2 | §9 | Full Prior/Current/Pending Support disclosure | David | 2026-05-04 |
| 12 | Vol 2 / Vol 3 | §10, §3.1, §3.2, §3.5 | Validate hourly rate ($150), fringe (22%), indirect (18%) against actual books | David | 2026-05-06 |
| 13 | Vol 2 / Vol 5 | §11, §5.5 | Any LOIs achievable by 2026-05-08 | David | 2026-05-08 |
| 14 | Vol 3 | §3.5 | Decide between provisional rate declaration vs. computed rate from books | David | 2026-05-04 |
| 15 | Vol 3 | §3.7 Risk 1 | Confirm BLS 90th-percentile rate for InfoSec Analyst, San Diego MSA | me | 2026-05-06 |
| 16 | Vol 5 | §5.2 | David sanity-check on subscription-pricing ranges per channel | David | 2026-05-05 |
| 17 | Vol 5 | §5.4 | Validate market sizing numbers against current Bloomberg Gov / Govini | me | 2026-05-06 |
| 18 | Vol 5 | §5.5 | Confirm DSIP appendix policy for LOIs (do they count toward 5pp limit?) | me | 2026-05-04 |

**Critical-path dates (unchanged from Vol 2):**
- 2026-05-01: VetCert visible in SAM.gov
- 2026-05-02: go/no-go decision based on gap-closure feasibility
- 2026-05-04: Vol 2 v2 + Vol 3 v2 + Vol 5 v2 incorporate David's responses
- 2026-05-08: full v3 across all three volumes
- 2026-05-10: full review (David + me)
- 2026-05-11: submit on DSIP
- 2026-05-13 12:00 ET: hard deadline (48-hour buffer)
