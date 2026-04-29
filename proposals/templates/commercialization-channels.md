# Template: Commercialization Channels (Vol 5 §5.2 pattern)

**Source:** structure harvested from `archive/asema-2026-04/vol3_vol5_draft_v1.md` §5.2
**Status:** structure reusable; per-customer content is per-proposal
**Use for:** Vol 5 Commercialization Strategy "Phase III paths" section in any SBIR proposal

The structure (5 paths grouped into 3 categories) is reusable. The customer/buyer/contracting/pricing detail is per-proposal — pull from the relevant `capability.phase3_target_customers` field in `capabilities.json` and develop fresh for the specific opportunity.

**Page budget guidance.** Vol 5 is typically 5pp total. This section (§5.2) typically gets 2-3pp. Each path = ~0.4-0.6 pp.

---

## §X.2 Phase III commercialization paths

{{AGENCY}}'s commercialization expectation for an SBIR Phase I is a credible, evidence-based plan, not a guarantee. We identify {{N_PATHS}} distinct go-to-market paths grouped into {{N_CATEGORIES}} categories. Each path has an explicit early customer profile, contracting vehicle, and pricing posture.

---

### Path A — {{PATH_A_LABEL}}

**Customer.** {{PATH_A_CUSTOMER}}

**Buyer profile.** {{PATH_A_BUYER}}

**Contracting vehicle.** {{PATH_A_CONTRACT_VEHICLE}} — see `sdvosb-phase3-framing.md` for Phase III sole-source language; layer agency-specific vehicles here (GSA MAS, GWAC, agency BPA, etc.).

**Pricing posture.** {{PATH_A_PRICING}}

**Time horizon.** {{PATH_A_TIME_HORIZON}}

---

### Path B — {{PATH_B_LABEL}}

(repeat structure)

---

### Path C — {{PATH_C_LABEL}}

(repeat structure)

---

### Path D — {{PATH_D_LABEL}}

(repeat structure)

---

### Path E — {{PATH_E_LABEL}}

(repeat structure)

---

[CONFIRM: pricing ranges in §X.2 are market estimates from public procurement data; David should sanity-check before final submission. Rough sources: GSA MAS price lists, [SAM.gov contract awards](https://sam.gov), and FedScoop/FedTalk coverage of recent agency-tooling buys.]

---

## Path category framework (recommended grouping)

For most Komatik proposals, group paths into three categories:

1. **Federal civilian** — agencies like CISA, FAA, NASA program offices, civilian SOCs (IRS/SSA/VA/HHS), and ISAC consortia
2. **Federal defense** — DoD program offices, NAVAIR/AFRL/ONR, military training commands, Combatant Command operational support
3. **Commercial regulated industries** — financial services (FINRA/SEC compliance), healthcare (HIPAA), critical infrastructure (sector ISACs that include commercial members)

For Vector-led proposals: federal civilian = FAA + NASA Ames; federal defense = NAVAIR/AETC ATC academies; commercial = ATC training schools, simulation vendors. For Trace-led proposals: pull from the ASEMA archive's Path A-E framework (CISA + ISACs, DoD program offices, civilian SOCs, financial services, healthcare). For Base Camp-led proposals: federal civilian = agency software-modernization buyers; federal defense = DARPA I2O / AFRL/RI / ONR Code 31; commercial = TBD per pitch.

---

## Per-path content checklist

For each path, the reviewer expects four answers:

- [ ] **Customer:** named institution or institution-class with a specific operational need
- [ ] **Buyer profile:** the actual person/role with budget authority (NOT just "the agency")
- [ ] **Contracting vehicle:** the specific FAR/DFARS/agency mechanism (not "federal contract")
- [ ] **Pricing posture:** dollar range and basis (subscription, T&M, FFP, hybrid)

Bonus answers that strengthen the section:

- [ ] **Time horizon:** Phase III timeline ("first deployment late 2028") tied to Phase II completion
- [ ] **Existing relationship:** any warm contact, prior conversation, or named introduction (huge credibility boost)
- [ ] **Realism marker:** something that signals the proposer knows this customer's procurement rhythm (mentioning the agency's recent BAA/RFI, naming a specific contract vehicle they prefer)

---

## When LOIs (Letters of Interest) are achievable

Vol 5 §5.5 LOI section: see ASEMA `vol3_vol5_draft_v1.md` §5.5 for the language template. Rule of thumb:

- **Have an LOI:** name the supporter, attach as appendix, cite specifically in §5.5
- **Have a warm conversation but no letter:** describe the conversation in §5.5 honestly ("Discussions with [role] at [org] indicate evaluation interest"); do NOT inflate to a letter
- **Have nothing yet:** omit §5.5 entirely. Better to have no LOI section than a thin one. Stand on the structural Phase III + SDVOSB logic.

**Never fabricate.** Reviewers cross-check. Fabricated LOIs are the fastest way to get a proposer permanently flagged.
