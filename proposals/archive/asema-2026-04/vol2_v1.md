# DARPA SBIR 25.4 R12 — ASEMA — Volume 2 Technical Draft v1

**Topic:** HR0011SB20254-12 — Assessing Security of Encrypted Messaging Applications
**Proposer:** Latent Space LLC (DBA Komatik) · UEI XHM9MQFR5VC9 · CA · SDVOSB
**PI:** David Schirmer · U.S. Navy AC1 (E-6, ~12 years) · 100% service-connected disabled veteran
**Period of Performance (Phase I):** 6 months
**Page budget:** 20 pp Volume 2 + 5 pp Volume 5 Commercialization (separate; doesn't count)
**Draft status:** v1 — first pass, ~80% completion. Tags: `[CONFIRM: ...]` = factual claim David must verify; `[NEEDS DAVID INPUT: ...]` = gap requiring direct authorship.

---

## How to read this draft

This is a *structural* first draft, not a submission-ready proposal. Every section has prose where prose is needed, but technical-depth claims about Komatik/Trace internals are written in placeholder language and tagged. The sequencing, page budget, and rhetorical posture are settled — what remains is hardening.

Prose tone follows your voice rules: no banned words, plain register, no consultantese. Length targets are bracketed at the start of each section.

---

## §1 Identification & Significance of the Innovation
*Target: 2 pp. Currently ~1.5 pp.*

**The problem.** Secure Messaging Applications (SMAs) — Signal, WhatsApp, Wire, Matrix/Element, Session, Threema, and the rapidly expanding category of enterprise Signal-modeled platforms like TeleMessage TM SGNL — carry an outsized share of the federal government's sensitive communications. The protocol cores of these applications have been studied carefully. Cohn-Gordon, Cremers, Dowling, Garratt, and Stebila published the canonical formal analysis of Signal's X3DH and Double Ratchet in 2016 and updated it in 2020 ([Cohn-Gordon et al., *Journal of Cryptology*](https://dl.acm.org/doi/abs/10.1007/s00145-020-09360-1)). Signal itself shipped a post-quantum-secure Triple Ratchet (SPQR) in October 2025, formally analyzed by Cryspen ([PQShield](https://pqshield.com/diving-into-signals-new-pq-protocol/)). Independent ProVerif and Tamarin verifications exist for both classical and post-quantum variants ([Positive-Intentions formal verification docs](https://positive-intentions.com/docs/technical/signal-protocol-formal-verification/); ACM 2024 post-quantum Tamarin work).

**The gap.** Protocol-core security is not where SMAs get compromised. They get compromised at the *systems* boundary: device exploitation (CVE-2025-5715, Signal Android biometric authentication bypass — [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-5715)); enterprise wrapper failure (CVE-2025-48927 TeleMessage TM SGNL, plaintext heap dump exposed via misconfigured Spring Boot Actuator, listed on CISA KEV July 2025 — [GreyNoise analysis](https://www.greynoise.io/blog/active-exploit-attempts-signal-based-messaging-app)); linked-device abuse for persistent surveillance (MITRE ATT&CK Mobile T1676 — [attack.mitre.org](https://attack.mitre.org/techniques/T1676/)); and supply-chain compromise of the underlying client/server runtime (CVE-2024-3094 XZ Utils, still present in 35 Docker Hub images a year after disclosure — [The Hacker News](https://thehackernews.com/2025/08/researchers-spot-xz-utils-backdoor-in.html)). The literature on these failure modes exists, but it lives across cryptography venues, mobile threat-defense vendor reports, NIST SP 1800 series practice guides, and CISA advisories. There is no operationally legible artifact that lets a small defender team — a program office, a SOC, an ISAC — answer the question: *given my SMA inventory, what's my actual risk posture, and what defensive measure should I prioritize this quarter?*

**The innovation.** [NEEDS DAVID INPUT: Komatik/Trace one-paragraph description in your voice — what Trace already does, in language a DARPA reviewer who's never heard of you can follow. Suggested skeleton: "Trace is an audit-bundle tooling layer for AI and software systems. It builds a structured threat-and-defense graph from a system's actual implementation — dependencies, runtime behavior, cryptographic boundaries, supply-chain provenance — and produces a defender-actionable artifact: a prioritized list of what to fix, with evidence." Replace with your actual framing.]

We propose to apply Trace's audit-graph methodology to the SMA threat surface. The work product is a reference threat ontology for SMAs, instantiated against the Signal Protocol family (Signal, Triple Ratchet, and the Signal-modeled enterprise category typified by TeleMessage), validated against three published adversary case studies, and operationalized as a defender-actionable scoring framework with a measurable success criterion (time-to-decision for a defender presented with a new CVE in their SMA stack).

**Why now.** SMA reliance grows; the threat surface grows faster; small defender teams remain unable to act on what the cryptography literature already proves. The post-Triple-Ratchet shift (Oct 2025) means even reference threat models from 2024 are out of date. A six-month Phase I lands a usable artifact at exactly the moment the SMA defender community needs it.

**Identification block.**
- Proposer: Latent Space LLC, DBA Komatik
- UEI: XHM9MQFR5VC9 (SAM.gov registered; renewal due ~2027-04-28)
- Certifications: SDVOSB (per VetCert; David Schirmer 100% SC disabled veteran) [CONFIRM: VetCert flow-through to SAM.gov visible by 2026-05-01]
- NAICS: 541511, 541512, 541330, 541715
- DBA: Komatik (consumer-facing) · Trace is the audit-bundle product line within Komatik

---

## §2 Phase I Technical Objectives
*Target: 2 pp. Currently ~1.5 pp.*

The Phase I objectives are deliberately scoped for a six-month, single-PI effort with consultant SME support. Each objective ties to a measurable artifact.

**Objective 1 — SMA threat ontology.** Define a structured taxonomy of SMA failure modes spanning six branches: (a) cryptographic protocol; (b) implementation/client; (c) device platform; (d) server/transport; (e) key management and identity; (f) supply chain. Each branch decomposes to leaf-level threat patterns with explicit evidentiary requirements. Anchored against MITRE ATT&CK Mobile (Initial Access, Persistence, Credential Access, Collection, C2) and NIST SP 1800-21/22 mobile device practice guides. *Artifact: written ontology, ~30-50 leaf nodes, peer-reviewed by one external SME.*

**Objective 2 — Signal Protocol reference threat graph.** Instantiate the ontology against the Signal Protocol family — classical Double Ratchet, post-quantum Triple Ratchet (SPQR), and the Signal-modeled enterprise category (TeleMessage TM SGNL as case representative). Build a directed graph linking ontology leaves to actual implementation artifacts: dependency packages, configuration choices, deployed binaries, server-side components. *Artifact: graph in machine-readable form (proposed: JSON-LD or similar) plus human-readable atlas.*

**Objective 3 — Adversary case-study replay.** Validate the graph against three published compromise events, selected to span the threat ontology:
1. **Cryptographic / formal layer:** the unknown key-share (UKS) attack vector identified by Frosch et al. and re-derived in the 2024 Logic of Events Theory analysis ([Scientific Reports 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11375095/)).
2. **Implementation / device layer:** CVE-2025-5715 (Signal Android biometric authentication missing critical step, [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-5715)).
3. **Wrapper / enterprise / supply-chain layer:** CVE-2025-48927 TeleMessage TM SGNL Spring Boot Actuator heap-dump exposure, on CISA KEV ([GreyNoise](https://www.greynoise.io/blog/active-exploit-attempts-signal-based-messaging-app)).

For each case, demonstrate that the graph (a) identifies the affected nodes, (b) suggests the precise defensive measure that would have prevented the compromise, and (c) does so in a form a defender team without a cryptography PhD can execute. *Artifact: written case-study walkthroughs with ontology mapping.*

**Objective 4 — Defender-actionable scoring framework.** Propose and calibrate a scoring/prioritization framework that takes (defender SMA inventory, current CVE/threat feed) → (prioritized action list with evidence). The framework's success metric is **time-to-decision (TTD)**: how long it takes a defender team, presented with a new SMA-related CVE, to determine (a) whether they're affected, (b) what the right defensive action is, and (c) what evidence supports that action. *Baseline TTD measurement: read-team review of three CVE disclosure-to-defender-action timelines from the past 18 months. Target: reduce TTD by ≥50% in pilot evaluation.* [CONFIRM: targets of 50% are aspirational — DARPA values measurable improvement claims with stated baselines, but reviewers will challenge unsupported numbers. Hold the framework, soften the percentage if a defensible baseline isn't available by week 2.]

**Out of scope for Phase I.** Original cryptanalysis. New formal-verification proofs. Defensive tooling implementation. Operational deployment. Phase II will scale to additional SMAs and integrate with continuous monitoring stacks; Phase III commercial paths are outlined in Volume 5.

---

## §3 Phase I Statement of Work
*Target: 5 pp. Currently ~3 pp — needs expansion in Tasks 2-3.*

**Task 1 — Ontology Development (Months 1-2).**
Activities: literature pull and synthesis spanning Cohn-Gordon et al. formal analysis corpus, MITRE ATT&CK Mobile matrix, NIST SP 1800-4/21/22, CISA KEV entries tagged for SMAs, and post-2024 Triple Ratchet/SPQR analysis. Construct ontology in iterative drafts with one external SME (paid consultant, ~10% LOE). Solicit one round of structured feedback. Deliverables: ontology v1 (Month 1 end), ontology v2 with SME review incorporated (Month 2 end). Risk: ontology over-fits to Signal. Mitigation: include at least one explicit cross-check against Matrix/Element protocol primitives in v2.

**Task 2 — Reference Graph Construction (Months 2-4).**
Activities: select Signal Protocol stack components for instantiation. Default selection:
- Signal client: open-source signal-android (latest stable) + signal-desktop (Electron build) — both available under public licenses with full source.
- Signal Protocol library: libsignal (Rust core, language bindings) — public source.
- Triple Ratchet / SPQR: post-Oct-2025 reference implementation (public per [Signal blog](https://pqshield.com/diving-into-signals-new-pq-protocol/)).
- Enterprise wrapper case: TeleMessage TM SGNL — public CVE record only; no source access required for graph construction.

[NEEDS DAVID INPUT: Trace's actual graph-construction tooling — what does Komatik/Trace already produce that maps to "directed graph linking ontology leaves to implementation artifacts"? Two paragraphs. If the answer is "not yet but the methodology generalizes from prior work on X," say that and name X.]

Deliverables: machine-readable graph (Month 3 end), human-readable atlas with diagrams (Month 4 end). Risk: graph completeness is unbounded. Mitigation: hard scope to the three case-study coverage requirement from Objective 3 — graph is "complete" when it maps each case-study compromise to defendable evidence.

**Task 3 — Case-Study Replay and Scoring Calibration (Months 4-5).**
Activities: walk each of the three case studies (UKS, CVE-2025-5715, CVE-2025-48927) through the graph. Document at each step: which ontology node is implicated, what evidence the graph surfaces, what defensive action it recommends. Score the framework's TTD against published disclosure-to-mitigation timelines for each case. Calibrate scoring weights against case-study results. Deliverables: three case-study walkthroughs (Month 4 end), scoring framework v1 with calibration data (Month 5 end). Risk: published timelines are sparse for enterprise SMA cases. Mitigation: supplement with one structured interview with a federal SOC contact regarding their actual TeleMessage CVE response timeline. [CONFIRM: identify and approach SOC contact by Month 4; if not available, substitute with academic CVE timeline literature.]

**Task 4 — Defender Pilot (Months 5-6).**
Activities: identify one operational defender team — federal program office, civilian agency SOC, sector ISAC, or DoD cyber unit — willing to dry-run the scoring framework against their actual SMA inventory. Provide the framework, ontology, graph, and atlas. Capture: did the framework reduce their TTD on a current SMA-related decision? What did they like? What broke? Deliverables: pilot engagement memorandum (Month 5 mid), pilot results writeup (Month 6 end). Risk: this is the proposal's hardest commitment. Mitigation: scope as "dry-run" not "deployment" — pilot partner does not need to operationally adopt the tooling, only run one decision through it. [NEEDS DAVID INPUT: any existing federal/SOC contacts? Even one warm intro materially de-risks Task 4. If none, plan to use SoCal VBOC and AFWERX outreach to find one during Months 1-3.]

**Continuous activities (all months).** Monthly progress report to DARPA Program Manager. Quarterly review with SME consultant. Final report to DARPA at Month 6 end, including transition recommendations to Phase II.

**Schedule summary.**

| Month | Task 1 | Task 2 | Task 3 | Task 4 | Continuous |
|---|---|---|---|---|---|
| 1 | Ontology v1 | | | | Monthly report |
| 2 | Ontology v2 | Component selection | | | Monthly report |
| 3 | | Graph machine-readable | | | Monthly report; SME review |
| 4 | | Graph atlas | Case-study walkthroughs | Pilot memo | Monthly report |
| 5 | | | Scoring v1 | Pilot engagement | Monthly report |
| 6 | | | | Pilot results | Final report |

---

## §4 Related Work
*Target: 2 pp. Currently ~1.5 pp.*

**Formal protocol analysis.** Cohn-Gordon, Cremers, Dowling, Garratt, and Stebila ([2020 *Journal of Cryptology*](https://dl.acm.org/doi/abs/10.1007/s00145-020-09360-1)) provide the canonical formal analysis of Signal's X3DH and Double Ratchet, capturing the multi-stage AKE structure and the post-compromise security property. Frosch et al. earlier identified an unknown key-share (UKS) vulnerability; the 2024 Logic of Events Theory analysis ([Scientific Reports](https://pmc.ncbi.nlm.nih.gov/articles/PMC11375095/)) re-derived this finding using a different formal method. Bellare et al. provided game-based ratchet security definitions. Alwen, Coretti, and Dodis formalized immediate decryption properties. Post-quantum extensions: ACM 2024 Tamarin verification of post-quantum Signal ([dl.acm.org](https://dl.acm.org/doi/10.1007/978-3-031-49737-7_8)); PQShield/Cryspen work on the Triple Ratchet shipped October 2025 ([PQShield](https://pqshield.com/diving-into-signals-new-pq-protocol/)).

**Implementation verification.** Independent Rust implementations of the Signal Protocol with ProVerif (symbolic) and Hax-to-F*/Rocq/Lean (proof extraction) verification pipelines exist in the open-source community ([Positive-Intentions Signal Protocol formal verification docs](https://positive-intentions.com/docs/technical/signal-protocol-formal-verification/)).

**Mobile threat surface.** MITRE ATT&CK Mobile matrix ([attack.mitre.org/matrices/mobile](https://attack.mitre.org/matrices/mobile/)) catalogs initial-access, persistence, credential-access, and collection techniques applicable to mobile messaging clients. Particularly relevant for SMAs: Linked Devices T1676 (Signal/WhatsApp linked-device abuse for persistent surveillance — [attack.mitre.org/techniques/T1676](https://attack.mitre.org/techniques/T1676/)). NIST SP 1800-4 (Mobile Device Security) and SP 1800-21/22 (Mobile Threat Defense practice guides) provide the federal baseline ([nccoe.nist.gov](https://www.nccoe.nist.gov/publication/1800-4/VolB/)).

**Real-world compromise events.** CVE-2024-3094 (XZ Utils backdoor, supply-chain RCE in widely-used compression library, persisting in 35 Docker Hub images one year after disclosure — [SecurityWeek](https://www.securityweek.com/supply-chain-attack-major-linux-distributions-impacted-by-xz-utils-backdoor/), [The Hacker News follow-up](https://thehackernews.com/2025/08/researchers-spot-xz-utils-backdoor-in.html)). CVE-2025-48927 (TeleMessage TM SGNL Spring Boot Actuator heap-dump exposure, CISA KEV — [GreyNoise](https://www.greynoise.io/blog/active-exploit-attempts-signal-based-messaging-app)). CVE-2025-5715 (Signal Android biometric authentication bypass — [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-5715)).

**Position of this work.** The corpus above is sufficient for a cryptographer or a senior security researcher to reason about SMA risk in their own head. It is *not* sufficient for a small defender team to act on. The gap this work addresses is operational legibility, not new cryptanalysis. We do not propose to outdo Cohn-Gordon, Cremers, or Cryspen on protocol analysis; we propose to make their results, and the broader threat-surface literature, executable for a defender who has 30 days and a CVE feed.

---

## §5 Relationship with Future Research
*Target: 1 pp. Currently ~0.5 pp.*

**Phase II (24 months, ~$2M).** Scale the ontology, graph, and scoring framework across at least three additional SMAs (Matrix/Element, Wire, Session) and one additional Signal-modeled enterprise platform. Deliver as a hosted service with API access for defender teams. Integrate with one continuous-monitoring stack (proposed: STIX/TAXII feed publication for sector ISACs). Conduct two operational pilots beyond Phase I's dry-run.

**Phase III commercialization paths.** Three federal civilian channels (CISA, sector ISAC tooling support, federal SOC contracts via Phase III sole-source authority under [15 U.S.C. § 638(r)(4)](https://www.law.cornell.edu/uscode/text/15/638)). Two commercial channels (regulated industries with BYOD SMA leakage risk: financial services, healthcare). Detailed in Volume 5.

**Post-quantum extension.** Phase II will incorporate the Triple Ratchet / SPQR threat surface that emerged after October 2025. Phase III may extend to other post-quantum SMA designs as they emerge.

---

## §6 Key Personnel
*Target: 2 pp. Currently ~1 pp — needs expansion with full bio.*

**Principal Investigator: David Schirmer**

[NEEDS DAVID INPUT: full bio — 1 page. DARPA reviewers want concrete operational experience, not generic founder language. Skeleton:
- *Header line:* David Schirmer, Founder & PI, Latent Space LLC. U.S. Navy AC1 (E-6, ~12 years). 100% service-connected disabled veteran.
- *Operational experience:* 1 paragraph on Navy air-traffic-control role. What systems you operated. What "mission-critical communications" meant in practice. What you learned about trust assumptions in encrypted channels.
- *Technical capability:* 1 paragraph on Komatik/Trace work to date. What you've shipped. What you've learned about audit graphs and threat modeling.
- *Domain fit for ASEMA:* 1 paragraph connecting Navy comms experience to SMA defender perspective. Honest version: you're not a cryptographer, you're a practitioner who's lived inside the trust assumptions reviewers want modeled.
- *Level of effort:* 100% LOE on this Phase I.]

**Technical Advisor: [TBD by 2026-05-05]**

[NEEDS DAVID INPUT: David has declined to spend hours sourcing an SME advisor. Two options: (a) submit without one, accept the scoring penalty, (b) submit with a placeholder commitment to retain one within 30 days of award. Option (b) is honest and standard practice. Suggested language: "PI will retain one external Subject Matter Expert with published credentials in cryptographic protocol analysis or mobile messaging security, at ~10% LOE for the period of performance, within 30 days of contract award. SME selection criteria and shortlist methodology are documented; final selection contingent on availability." This costs ~$20K in Vol 3 cost narrative but is non-binding to a specific person. Reviewers prefer named SMEs but accept this pattern.]

**Subcontractors and consultants.** Up to 33% of total Phase I award value may be subcontracted per SBA SBIR rules. Reserved for the SME consultant and any specific protocol-analysis tooling vendor identified during Task 1.

---

## §7 Facilities and Equipment
*Target: 1 pp. Currently ~0.5 pp.*

Phase I requires no specialized facilities. All work product is software, written analysis, and structured data artifacts.

**Compute environment.** Existing Komatik cloud development infrastructure (commercial cloud provider, [CONFIRM: name AWS/GCP/Azure as actually used]). Sufficient for ontology development, graph construction, case-study replay, and pilot artifact preparation.

**Reference implementations.** All three Signal Protocol family components targeted for graph instantiation are available under public licenses: signal-android (GPLv3), signal-desktop (AGPLv3), libsignal (AGPLv3 / commercial). Triple Ratchet / SPQR reference per Signal's October 2025 release. TeleMessage TM SGNL CVE record is public; no source access required.

**Document handling.** No classified material is anticipated for Phase I. All references are publicly available. CUI handling per DARPA standard SBIR Phase I terms; no specific facility clearance required for proposal scope. [CONFIRM: if any DARPA pilot partner requires controlled handling, this section escalates — flag during Task 4 partner identification.]

**Travel.** One trip to DARPA HQ (Arlington, VA) for kickoff meeting; one optional trip for in-person SME review or pilot partner engagement.

---

## §8 Subcontractors and Consultants
*Target: 1 pp. Currently ~0.5 pp.*

**SBIR Phase I subcontracting limits.** Per SBA SBIR program rules, the small business concern must perform at minimum 67% of the research work (measured by cost, including indirect). Up to 33% may be subcontracted. This proposal anticipates substantially less than 33% subcontracted activity.

**Planned subcontractors / consultants.**

1. **Subject Matter Expert (SME) consultant.** ~10% LOE for the 6-month period of performance. Anticipated cost ~$20,000 of total award. Function: ontology peer review (Task 1), case-study consultation (Task 3), proposal review of pilot engagement framing (Task 4). Selection criteria: published credentials in cryptographic protocol analysis or mobile messaging security; willingness to be named in final report; conflict-of-interest screening per FAR 9.5.

2. **Reserve for tooling vendor.** Up to ~$5,000 reserved for specialized protocol-analysis tooling licenses or services (e.g., commercial dependency-graph tooling, ProVerif/Tamarin tooling support contracts). Specific selection contingent on Task 1 ontology shape.

**No teaming arrangements with other small businesses are planned for Phase I.** Phase II may include teaming with continuous-monitoring stack vendors and pilot partners.

---

## §9 Prior, Current, or Pending Support
*Target: 1 pp. Currently ~0.5 pp.*

[NEEDS DAVID INPUT: full disclosure required. Truthful list of:
- Any concurrent SBIR/STTR submissions (federal-wide, not just DARPA)
- Any prior or current DARPA awards
- Any prior or current other federal R&D awards (NSF, NIH, DoE, etc.)
- Any current commercial contracts with overlap to ASEMA scope
- Any equity investment received that would constitute "support"
- Any in-kind support from universities, accelerators, or other entities

Skeleton language if all are "none":

> "The Principal Investigator and Latent Space LLC have no current, prior, or pending federal R&D support relevant to the proposed work. The proposer is not concurrently submitting to any other DARPA SBIR topic in this release. The proposer has no equity investors and no in-kind support arrangements with universities, accelerators, or third parties that would constitute support requiring disclosure under DARPA SBIR rules."

If any item is non-zero, list it explicitly with award number, period of performance, dollar value, and overlap statement.]

---

## §10 Cost Volume Reference and Schedule
*Target: 1 pp. Currently ~0.5 pp.*

Detailed cost breakdown is provided in Volume 3. Summary for Volume 2 reference:

| Category | Phase I (6 mo) |
|---|---|
| Direct labor (PI 100% LOE) | ~$95,000 |
| SME consultant (10% LOE) | ~$20,000 |
| Cloud / dev environment | ~$5,000 |
| Tooling reserve | ~$5,000 |
| Travel (1 mandatory + 1 optional) | ~$3,500 |
| Indirect (overhead + G&A, ~40% loaded) | ~$48,000 |
| Subtotal | ~$176,500 |
| Fee (7% — SBIR cap) | ~$12,355 |
| **Total** | **~$188,855** |

This sits within the DARPA SBIR Phase I base ceiling (~$200K) with margin for cost negotiation. The 150% cap option (~$225K) is not requested at proposal time but may be discussed at award negotiation if scope expands. [CONFIRM: hourly rate assumption ($150/hr × 632 hrs ≈ $95K) and indirect rate (~40%) — David should validate against his actual books before final cost volume submission.]

**Schedule.** 6-month period of performance. Tasks 1-4 sequenced per §3 schedule table. Final report Month 6.

---

## §11 Commercialization Strategy (Volume 2 summary; full version in Volume 5)
*Target: 1 pp. Currently ~0.5 pp.*

Three federal channels and two commercial channels. Detailed in Volume 5.

**Federal civilian — primary.** CISA (SMA risk advisory tooling), federal SOCs (decision-support integration), sector ISACs (financial services FS-ISAC, health H-ISAC). Phase III sole-source pathway under SDVOSB authority ([15 U.S.C. § 638(r)(4)](https://www.law.cornell.edu/uscode/text/15/638)) enables direct contracting with any federal agency once Phase II is completed, no competition required, no dollar cap.

**Federal defense — secondary.** DoD program offices using SMAs for unclassified-but-sensitive comms; specific candidates identified during Phase II partner engagement.

**Commercial regulated industries.** Financial services and healthcare both have BYOD SMA leakage risk and active compliance pressure (FINRA, HIPAA). Phase II pilot scope.

**SDVOSB scoring posture.** This proposer is a fully certified SDVOSB. Award would count toward the federal 5% SDVOSB goal (raised from 3% via NDAA FY24, ~$31B/yr target). Phase III sole-source authority is uncapped and uncontested. This is asymmetric upside for the program.

**Letters of interest (LOIs).** [NEEDS DAVID INPUT: are any LOIs achievable by 2026-05-08? Not required for Phase I but improves commercialization score. Even a one-paragraph "interested in evaluating" letter from a federal SOC, ISAC, or program office contact is valuable. If none achievable, omit and let the strategy stand on logic alone.]

---

## §12 Identification of Innovation (back-cover summary, not separately page-budgeted)

One paragraph DARPA review-board readout:

> The Latent Space team proposes to build a defender-actionable threat ontology, reference graph, and scoring framework for Secure Messaging Applications, anchored on the Signal Protocol family (Double Ratchet, Triple Ratchet/SPQR, and Signal-modeled enterprise variants). The work bridges the gap between formal protocol analysis (which exists, is rigorous, and is unactionable for small defender teams) and operational defender decision-making (which urgently needs structured prioritization). Phase I delivers a working ontology validated against three published compromise events, a calibrated scoring framework with measurable time-to-decision improvement, and one defender-team dry-run pilot. The PI is a Navy AC1 with 12 years of mission-critical communications experience and a 100% service-connected disability rating; the proposer is an SDVOSB-certified small business in California. SDVOSB Phase III sole-source authority creates an asymmetric path from Phase II directly to federal civilian deployment.

---

# What this draft is and isn't

**Is:**
- A complete structural skeleton for all 11 required Volume 2 sections
- Citation-anchored on real, published threat-model literature
- Honest about what's strong (citations, scoping, SDVOSB posture) and what's weak (no SME yet, no LOIs, Trace technical depth needs your hand)
- Voice-rule compliant (no banned words, plain register)
- Page-budgeted to fit DARPA's 20pp Volume 2 limit at full expansion

**Isn't:**
- Submission-ready — every `[NEEDS DAVID INPUT]` tag is a real gap
- A substitute for your judgment on Trace's actual technical claims
- Formatted to DARPA template — final pass requires the official template export and reformat
- A guarantee of award — Phase I baseline is ~10-15%, the SDVOSB lift gets you to maybe 18-20%

# Gap checklist (extracted)

Every `[CONFIRM]` and `[NEEDS DAVID INPUT]` tag from above, in one place:

| # | Section | Item | Owner | Due |
|---|---|---|---|---|
| 1 | §1 | Trace one-paragraph description in your voice | David | 2026-05-02 |
| 2 | §1 | Confirm VetCert flow-through visible in SAM.gov | David | 2026-05-01 |
| 3 | §2 / Obj 4 | Confirm 50% TTD reduction target is defensible or soften | David + me | 2026-05-04 |
| 4 | §3 / Task 2 | Trace's actual graph-construction tooling description | David | 2026-05-03 |
| 5 | §3 / Task 3 | Identify SOC contact for TeleMessage timeline interview | David | 2026-05-08 |
| 6 | §3 / Task 4 | Any existing federal/SOC/ISAC contacts for pilot partner | David | 2026-05-05 |
| 7 | §6 | Full PI bio (1 page) | David | 2026-05-04 |
| 8 | §6 | SME advisor decision: name now or commit-within-30-days language | David | 2026-05-05 |
| 9 | §7 | Cloud provider name | David | 2026-05-02 |
| 10 | §7 | CUI/clearance escalation flag if pilot partner needs it | David | 2026-05-08 |
| 11 | §9 | Full Prior/Current/Pending Support disclosure | David | 2026-05-04 |
| 12 | §10 | Validate hourly rate and indirect rate against actual books | David | 2026-05-06 |
| 13 | §11 / Vol 5 | Any LOIs achievable by submission date | David | 2026-05-08 |

**Critical path for May 13 submission:**
- 2026-05-01: SAM.gov / VetCert verified
- 2026-05-02: go/no-go decision based on gap-closure feasibility
- 2026-05-04: Vol 2 v2 incorporates David's responses to gaps 1, 4, 7, 11, 12
- 2026-05-08: Vol 2 v3, Vol 3 cost workbook complete, Vol 5 commercialization complete
- 2026-05-10: full review (David + me)
- 2026-05-11: submit on DSIP
- 2026-05-13 12:00 ET: hard deadline (48-hour buffer)
