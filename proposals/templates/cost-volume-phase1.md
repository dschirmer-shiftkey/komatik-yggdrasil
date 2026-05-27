# Template: Phase I Cost Volume Narrative

**Source:** harvested from `archive/asema-2026-04/vol3_vol5_draft_v1.md` §§3.1-3.8
**Status:** parameterized — pulls rates from `../rates.yaml`, totals from per-proposal cost worksheet
**Use for:** any Phase I SBIR cost narrative (NASA, DoD, NSF, DOE, NIH variants)
**Page budget:** typically 1-3 pp narrative + structured cost upload (DSIP, eRA Commons, etc.)

---

## How to use this template

1. Validate `../rates.yaml` against agency-specific rules first. SBIR core rules are uniform; agency variants exist (NIH F&A treatment differs from DoD; NSF allows different fringe approaches).
2. Replace every `{{TOKEN}}` with the actual value or computed cell reference.
3. Replace every `[CONFIRM: agency-specific]` with verified language from the current SOW.
4. Reconcile the cost-volume narrative totals with the structured upload. Reviewers WILL diff them.
5. Keep the cost-realism statement (§3.8) — it is reusable as written and reviewers expect it.

---

## §3.1 Cost summary

This Phase I cost proposal totals **${{TOTAL_PROPOSED_PRICE}}**, sitting under the {{AGENCY}} SBIR Phase I ceiling of ~${{CEILING}} with margin reserved for negotiation and unforeseen direct-cost items. {{CAP_OPTION_LANGUAGE}}. The proposer is a single-PI small business (Latent Space LLC, DBA Komatik), an SDVOSB, and elects to perform the substantial majority of work in-house.

| Line | Category | Phase I ({{POP_MONTHS}} mo) | Notes |
|---|---|---|---|
| 1 | Direct labor — PI ({{PI_LOE}}% LOE) | ${{LABOR_DIRECT}} | {{PI_HOURS}} hrs × ${{PI_RATE}}/hr (rates.yaml: labor.pi_principal_investigator) |
| 2 | Direct labor — fringe | ${{FRINGE}} | {{FRINGE_PCT}}% on direct labor (rates.yaml: fringe) |
| 3 | Subcontractor / consultant ({{SUB_LOE}}% LOE) | ${{SUB_COST}} | {{SUB_BASIS}} |
| 4 | Tooling / specialized purchases | ${{TOOLING}} | {{TOOLING_BASIS}} |
| 5 | Cloud / dev environment | ${{CLOUD}} | {{CLOUD_PROVIDER}}, {{CLOUD_BASIS}} |
| 6 | Travel | ${{TRAVEL}} | {{TRAVEL_BASIS}} |
| 7 | Materials & supplies | ${{MATERIALS}} | {{MATERIALS_BASIS}} |
| 8 | Direct cost subtotal | ${{DIRECT_SUBTOTAL}} | Lines 1–7 |
| 9 | Indirect (overhead + G&A) | ${{INDIRECT}} | {{INDIRECT_PCT}}% on direct cost subtotal (rates.yaml: indirect) |
| 10 | Total cost | ${{TOTAL_COST}} | Lines 8 + 9 |
| 11 | Fee ({{FEE_PCT}}% — SBIR fee cap) | ${{FEE}} | On total cost |
| 12 | **Total proposed price** | **${{TOTAL_PROPOSED_PRICE}}** | Lines 10 + 11 |

**Reconciliation.** The narrative totals must match the structured cost upload exactly. Any rounding discrepancies must be reconciled (typically by adjusting line 11 fee by $1-$10) before submission.

## §3.2 Direct labor — PI

**Rate basis.** The PI labor rate of ${{PI_RATE}}/hour reflects {{RATE_BASIS}}. For a Phase I SBIR, the simplest defensible structure is:

- David Schirmer is the sole employee/owner of Latent Space LLC.
- Phase I PI labor is logged against {{PROJECT_SHORTNAME}} at {{PI_LOE}}% level of effort for {{POP_MONTHS}} months.
- Standard work-year for federal cost accounting: 2,080 hours; {{POP_MONTHS}} months = {{POP_HOURS}} hours; 100% LOE = {{POP_HOURS}} hours billable. We propose **{{PI_HOURS}} hours billable**, which represents **~{{DIRECT_CHARGE_PCT}}% direct-charged time** with the remaining {{INDIRECT_CHARGE_PCT}}% absorbed in indirect / business operations / unbillable activity. This conservative direct-charge ratio is honest for a single-PI small business and survives reviewer scrutiny.

**Why {{PI_HOURS}} hours not {{POP_HOURS}}.** Reviewers have seen too many SBIR cost volumes that propose 100% of an owner's calendar as billable. That triggers indirect-allocation skepticism and DCAA flags. Proposing {{PI_HOURS}} billable hours — ~{{HOURS_PER_WEEK}} hours/week direct-charged on {{PROJECT_SHORTNAME}}, balance on company operations — is more credible and matches the actual rhythm of running a small business while executing a contract.

**Cost computation.**
- {{PI_HOURS}} hrs × ${{PI_RATE}}/hr = ${{LABOR_DIRECT}} base salary
- Fringe ({{FRINGE_PCT}}% of base): ${{FRINGE}} — covers self-employment-tax employer share, health insurance equivalent, paid time off equivalent
- Loaded direct labor: **${{LABOR_LOADED}}**

**Backup for rate.** BLS Occupational Employment and Wages May 2024 data for {{BLS_OCCUPATION}} ({{BLS_SOC_CODE}}) at the 90th percentile in {{BLS_MSA}} ≈ ${{BLS_HOURLY}}/hr. The proposed rate of ${{PI_RATE}} reflects {{RATE_PREMIUM_RATIONALE}}. [CONFIRM with current BLS data closer to submission.]

## §3.3 Subcontractors

{{SUBCONTRACTOR_NARRATIVE_OR_NONE}}

**Subcontracting limits compliance.** Per SBA SBIR rules ([13 CFR § 121.702](https://www.ecfr.gov/current/title-13/chapter-I/part-121/subpart-A/section-121.702)), the small business concern (Latent Space LLC) must perform a minimum of two-thirds (67%) of the research and development by cost. Subcontracted activity totals ${{SUB_TOTAL}} of ${{TOTAL_COST}} total cost = **{{SUB_PCT}}%**, well within the 33% ceiling.

## §3.4 Other direct costs

**Cloud / dev environment (${{CLOUD}}).** {{CLOUD_NARRATIVE}}

**Travel (${{TRAVEL}}).**
| Trip | Origin | Destination | Purpose | Estimated cost |
|---|---|---|---|---|
| 1 | {{TRIP1_ORIGIN}} | {{TRIP1_DEST}} | {{TRIP1_PURPOSE}} | ${{TRIP1_COST}} |
| 2 | {{TRIP2_ORIGIN}} | {{TRIP2_DEST}} | {{TRIP2_PURPOSE}} | ${{TRIP2_COST}} |

Costs follow GSA per-diem and FedRAMP-compliant booking practice; no first-class airfare; meals at standard CONUS rate. Receipts retained per FAR Part 31.

**Materials & supplies (${{MATERIALS}}).** {{MATERIALS_NARRATIVE}}

## §3.5 Indirect costs

**Indirect rate ({{INDIRECT_PCT}}% on direct cost subtotal).** Composite indirect rate covering:

- Overhead (rent for home office allocation per IRS safe-harbor; software licenses for general business operations; professional services — legal, accounting, insurance);
- General & Administrative (state and federal compliance filings; SAM.gov maintenance; GSA-compliant accounting system implementation cost amortized);
- Bid & proposal costs (capped per [FAR 31.205-18](https://www.acquisition.gov/far/31.205-18)).

**Provisional rate declaration.** {{NICRA_STATUS_BLOCK}}

> "Latent Space LLC has not previously been subject to federal indirect-rate audit. Indirect rates proposed in this volume ({{INDIRECT_PCT}}% composite overhead + G&A) are provisional, supported by the company's current general-ledger accounting practice. The proposer commits to true-up at award via incurred-cost submission per [FAR 52.216-7](https://www.acquisition.gov/far/52.216-7) if required by the awarding contracting officer."

## §3.6 Fee

**Fee at {{FEE_PCT}}% (SBIR cap).** SBA SBIR program rules cap fee at 7% of total cost. Proposed fee: ${{TOTAL_COST}} × 0.07 = ${{FEE}}. {{FEE_RATIONALE}}.

## §3.7 Cost narrative — risks and mitigations

**Risk 1: Hourly rate challenge.** A reviewer or contracting officer may probe the ${{PI_RATE}}/hr PI rate as high for a single-member LLC without prior federal contracting history. Mitigation: cite the 100% disabled-veteran founder status (no prior W-2 federal contracting compensation history applies), and offer to true-up at award if the rate is judged unsupportable. Backup rate: ${{BLS_HOURLY}}/hr based on BLS data (see §3.2).

**Risk 2: Indirect-rate challenge.** As above; provisional rate declaration with commitment to true-up resolves this for Phase I.

{{ADDITIONAL_RISK_BLOCKS}}

**Risk N: Travel cost volatility.** GSA per-diem is fixed; airfare is volatile. Mitigation: ${{TRAVEL}} line includes ~20% buffer over expected actual; residual returned if unspent.

## §3.8 Cost realism statement (REUSABLE VERBATIM — minor edits only)

This cost proposal reflects the actual scope, schedule, and risk of the Phase I research described in Volume 2. Costs are reasonable, allocable, and allowable per [FAR Part 31](https://www.acquisition.gov/far/part-31). No cost line is inflated to absorb scope creep, no line is suppressed to fit a budget envelope. The proposer has scoped Phase I deliberately to fit a single-PI {{POP_MONTHS}}-month effort within the {{AGENCY}} Phase I ceiling, with explicit out-of-scope items ({{OUT_OF_SCOPE_LIST}}) reserved for Phase II.

---

## Token glossary (fill these per proposal)

| Token | Source | Notes |
|---|---|---|
| `{{AGENCY}}` | SOW header | "NASA", "DARPA", "ONR", etc. |
| `{{CEILING}}` | SOW | NASA = $225,000; DARPA = ~$200K base or $225K cap variant |
| `{{CAP_OPTION_LANGUAGE}}` | per agency | NASA: "this proposal requests the full $225,000 cap." DARPA: "The 150% cap option is/is not requested." |
| `{{POP_MONTHS}}` | SOW | NASA = 6; DARPA = 6 |
| `{{POP_HOURS}}` | computed | POP_MONTHS × 173.3 ≈ 1040 for 6 mo |
| `{{PI_LOE}}` | proposal scope | typically 100 for Phase I |
| `{{PI_HOURS}}` | computed | from rates.yaml direct_charge_mix |
| `{{PI_RATE}}` | rates.yaml: labor.pi_principal_investigator.hourly_rate_usd | |
| `{{FRINGE_PCT}}` | rates.yaml: fringe.rate_pct | |
| `{{INDIRECT_PCT}}` | rates.yaml: indirect.rate_pct | |
| `{{FEE_PCT}}` | rates.yaml: fee.rate_pct | 7 |
| `{{DIRECT_CHARGE_PCT}}` | rates.yaml: direct_charge_mix.direct_charge_ratio × 100 | |
| `{{HOURS_PER_WEEK}}` | computed | PI_HOURS / (POP_MONTHS × 4.33) |
| `{{BLS_OCCUPATION}}` | rates.yaml: labor.pi_principal_investigator.bls_backup.occupation | |
| `{{BLS_MSA}}` | rates.yaml: labor.pi_principal_investigator.bls_backup.msa | |
| `{{BLS_HOURLY}}` | rates.yaml: labor.pi_principal_investigator.bls_backup.hourly | |
| `{{NICRA_STATUS_BLOCK}}` | rates.yaml: indirect.confirm | first-time submitter language |
| `{{OUT_OF_SCOPE_LIST}}` | per proposal | brief list of explicitly out-of-scope items |

---

## Pre-submission checklist

- [ ] Narrative totals match structured cost upload exactly (line by line)
- [ ] All `{{TOKEN}}` markers replaced
- [ ] `[CONFIRM: ...]` tags resolved or escalated to David
- [ ] BLS reference data refreshed within 60 days of submission
- [ ] Provisional indirect rate language matches rates.yaml current state
- [ ] Subcontractor compliance ratio recomputed against final cost figures
- [ ] Travel line tied to a specific named trip (no abstract budget)
