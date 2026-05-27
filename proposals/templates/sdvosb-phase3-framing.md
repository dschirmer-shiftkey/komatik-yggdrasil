# Template: SDVOSB + Phase III Sole-Source Framing

**Source:** harvested verbatim from `archive/asema-2026-04/vol3_vol5_draft_v1.md` §5.3
**Status:** verbatim reusable — minor token swaps only
**Use for:** Vol 5 Commercialization Strategy section on contract pathway, in any SBIR proposal where SBIR Phase III + SDVOSB combined posture is part of the commercial story.

This template is the SINGLE most reusable artifact harvested from the ASEMA work. The structural argument — SBIR Phase III sole-source ([15 USC 638(r)(4)](https://www.law.cornell.edu/uscode/text/15/638)) layered with SDVOSB sole-source ([FAR 19.1406](https://www.acquisition.gov/far/19.1406) / [13 CFR 125.20](https://www.ecfr.gov/current/title-13/chapter-I/part-125/subpart-B/section-125.20)) — applies identically to every Komatik SBIR submission. Do NOT rewrite this from scratch on each proposal. Pull this template, adjust the per-proposal token at the end, ship it.

---

## §X.X Phase III contract pathway and SDVOSB advantage

**SBIR Phase III sole-source authority** is the structural mechanism that makes the SBIR pathway commercially distinct from any other federal R&D vehicle. Under [15 U.S.C. § 638(r)(4)](https://www.law.cornell.edu/uscode/text/15/638), once an SBIR-funded technology has completed Phase II, any federal agency may award a Phase III contract directly to the SBIR awardee:

- No competition required;
- No dollar ceiling (this is the only sole-source authority in the FAR with an unlimited ceiling);
- Justification is the existence of the Phase II completion record, full stop;
- The technology funded under Phase III need only "derive from, extend, or complete" the Phase II work.

This authority alone justifies federal-civilian-channel investment by any SBIR awardee, because Phase III is the path from ${{PHASE_I_CEILING}} Phase I to $50M+ federal program-of-record without the procurement overhead that kills most small-business federal commercialization plans.

**SDVOSB layered advantage.** Latent Space LLC is a fully certified SDVOSB (David Schirmer, 100% service-connected disabled veteran, U.S. Navy AC1). This adds three structural advantages on top of the SBIR Phase III pathway:

1. **SDVOSB sole-source authority.** Independent of SBIR, federal agencies may award sole-source contracts to certified SDVOSBs up to $7.5M (manufacturing) or $4.5M (services) under [FAR 19.1406](https://www.acquisition.gov/far/19.1406). This creates a parallel commercialization path independent of Phase II completion.

2. **SDVOSB set-aside contracts.** Federal contracting officers must consider SDVOSB set-aside before competitive procurement under [FAR 19.1405](https://www.acquisition.gov/far/19.1405), when the rule-of-two applies (two qualified SDVOSBs available). This widens the accessible federal market for any award above ~$25K.

3. **Federal SDVOSB goal of 5%.** Per NDAA FY24, the federal contracting goal for SDVOSBs increased from 3% to 5% of total federal procurement spend, an annual target of approximately $31B. Federal customers under pressure to meet this goal will preferentially direct discretionary procurement to qualified SDVOSBs. {{PROJECT_SHORTNAME}}-funded technology, delivered by an SDVOSB, sits at the intersection of two federal priorities: {{AGENCY_PRIORITY_DOMAIN}} and SDVOSB attainment.

The combined effect: a Phase III pathway with SDVOSB layering is the most asymmetric commercialization posture available in federal R&D contracting. The proposer is fully and currently certified for both pathways. [CONFIRM: VetCert flow-through to SAM.gov visible — see capabilities.json company.size_certifications.sdvosb.verified_in_sam.]

---

## Token glossary

| Token | Source | NASA Appendix 2026A example |
|---|---|---|
| `{{PHASE_I_CEILING}}` | SOW | "$225K" |
| `{{PROJECT_SHORTNAME}}` | proposal title | "Vector" |
| `{{AGENCY_PRIORITY_DOMAIN}}` | agency mission | "airspace operations safety" |

---

## When NOT to use this template

- Pre-Phase II opportunities where Phase III commercialization is not yet asked for (rare — most SBIR Phase I proposals require commercialization narrative)
- Non-SBIR opportunities (BAA, contracted research) — the Phase III argument doesn't apply
- Topics where the agency has signaled they will award via a non-Phase-III vehicle (some DARPA topics specify Phase III alternatives)

In those cases, harvest only the SDVOSB section (3 numbered advantages) and drop the Phase III block.

---

## Cross-references

- Capability claims: pull `capabilities.json` company.size_certifications.sdvosb verbatim
- Phase III customer targeting per capability: pull `capabilities.json` capabilities[*].phase3_target_customers
- Commercialization channel detail: see `commercialization-channels.md` template
