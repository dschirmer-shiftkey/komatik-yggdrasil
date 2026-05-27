# PI Bio — David Schirmer

**Owner:** Latent Space LLC, DBA Komatik
**Version:** 0.1.0-scaffold
**Last updated:** 2026-04-29
**Review status:** scaffold — David fact-check Wed AM

---

## Purpose

Source-of-truth PI biographical paragraphs. Each paragraph is referenced by `paragraph_id` from `capabilities.json` (`pi_bio_paragraph_id` field) and by proposal templates (Vol 2 PI Qualifications section, Vol 4 Key Personnel section).

**Authoring rule:** when a paragraph is needed in a proposal, pull by `paragraph_id` and adapt only the closing sentence to tie to that proposal's specific aim. Never rewrite the operational facts.

**[CONFIRM: David]** tags indicate facts that need David's verbatim confirmation or precise dates/figures before the paragraph leaves scaffold status.

---

## paragraph_id: `pi_atc_operational`

**Used by capabilities:** vector
**Used by proposal sections:** PI Qualifications when capability_id = vector; Phase III commercialization realism when claiming FAA Tech Center, NASA Ames AOL, NAVAIR ATC, or AETC ATC academy customer reach.
**Length target:** 180-240 words for full version; 90-120 words for compact version.

### Full version (Vol 2 PI Qualifications, Vector-led proposals)

David Schirmer served approximately twelve years in the U.S. Navy as an Air Traffic Controller, reaching the rate of AC1 (E-6) before retiring at a 100% service-connected disability rating. **[CONFIRM: David — exact total years and end-date of active service; specific facilities controlled at, e.g. NAS [facility], approach control vs. tower assignments, peak ops volume per shift.]** His operational background covers radar approach control, tower operations, and **[CONFIRM: David — specific qualifications, e.g. CTO/RTO ratings held, supervisor qualifications, instructor designations]**. This is not aviation-adjacent experience — it is the operational seat the Vector simulation environment is designed to reproduce, and it gives the Komatik program direct insight into where existing ATC training tools fall short and where airspace-operations research benches diverge from controller reality.

David's veteran status (100% service-connected disability, certified SDVOSB through SBA VetCert) is the basis for Latent Space LLC's federal small-business posture, but the operational ATC background is what separates Vector from a generic simulation effort. In Phase III, this combination supports both the customer-development conversations (FAA Tech Center, NASA Ames Airspace Operations Lab, ATC training academies) and the technical credibility required when those buyers ask whether the simulation reflects how controllers actually work.

### Compact version (Vol 4 Key Personnel, biographical sketch)

PI: David Schirmer. Twelve years U.S. Navy ATC, AC1 (E-6) **[CONFIRM]**. Retired 100% service-connected. Operational ATC background includes **[CONFIRM: facility list, qualifications]**. Founder of Latent Space LLC (DBA Komatik), SDVOSB-certified through SBA VetCert. Direct controller experience is the source-of-truth for Vector simulation fidelity decisions.

### Open fact-check items (Wed AM)

1. Exact total years of active service (currently scaffolded as "~12")
2. End date of active service / retirement date
3. Facilities served (approach controls, towers, ARTCCs)
4. ATC qualifications held (CTO ratings, instructor/supervisor designations)
5. Peak operational tempo or distinguishing assignments worth naming
6. Any post-Navy aviation work (contractor, simulation, training)
7. Education credentials relevant to the PI bio (degree, certifications)

---

## paragraph_id: `pi_software_systems`

**Used by capabilities:** base_camp, trace
**Used by proposal sections:** PI Qualifications when capability_id = base_camp or trace; Vol 4 biographical sketch for software-systems-led proposals.
**Length target:** 180-240 words for full version; 90-120 words for compact version.

### Full version (Vol 2 PI Qualifications, Base Camp- or Trace-led proposals)

After his Navy service, David Schirmer founded Latent Space LLC (DBA Komatik) and built the Base Camp multi-agent fleet — a **[CONFIRM: David — exact agent count, currently scaffolded as 21]**-agent autonomous coordination system for software development with observability, approval-pipeline gates, and human-in-the-loop controls. **[CONFIRM: David — months/years of active operation; team size if any contractors involved; any deployed production use beyond Latent Space's own work]**. Base Camp is the operating environment within which Komatik's own products — Vector, Trace, and the rest of the V4.1 brand line — are built and audited.

Trace is the second software-systems capability: an audit-bundle tooling layer that produces defender-actionable audit graphs from system implementation, runtime behavior, and supply-chain provenance. **[CONFIRM: David — Trace's actual maturity: has it produced any audit bundles outside Latent Space's own systems? Any methodology document or open repo? Any partner or pilot conversations to disclose?]**

The combination — operating an agent fleet day-to-day while building an audit-graph methodology over that same fleet — is what positions Komatik for both agentic-systems R&D customers (DARPA I2O, AFRL/RI, ONR Code 31) and software-assurance buyers (FedRAMP-aligned audit programs, AI-governance buyers across civilian agencies). The PI is the principal designer and operator on both capabilities; this is not delegated work.

### Compact version (Vol 4 Key Personnel, biographical sketch)

PI: David Schirmer. Founder, Latent Space LLC (DBA Komatik). Designer and operator of Base Camp, a **[CONFIRM]**-agent fleet for autonomous software development. Designer of Trace, an audit-bundle methodology over implementation, runtime, and supply-chain provenance. **[CONFIRM: David — any prior software-engineering credentials worth naming, e.g. years pre-Navy in industry, formal CS background, public open-source work]**.

### Open fact-check items (Wed AM)

1. Exact Base Camp agent count (currently 21 from V4.1)
2. Base Camp's deployed history — months active, any external pilots
3. Trace's true maturity — paper-only, prototype, or applied
4. Any pre-Navy or post-Navy software-industry credentials worth naming
5. Formal CS/SWE education, certifications, or notable open-source contributions
6. Whether any teammates (contractors, advisors) should be named in Vol 4 Key Personnel
7. Public artifacts — repo URLs, demo videos, blog posts — that reviewers can independently verify

---

## Cross-cutting fact-check items

These touch both paragraphs:

1. Preferred PI byline name (David Schirmer? David B. Schirmer? Capt./AC1 retired naming preferences)
2. Email of record for proposals — currently `dschirmerii@gmail.com`; recommend `david@komatik.ai` if available
3. Any active security clearances worth disclosing (relevant for DoD SBIR 26.1 Watch row)
4. Any prior federal contract performance (PoP, customer, dollar amount) — feeds Vol 4 past performance section if present

---

## Versioning

Bump `_meta.version` in `capabilities.json` when this file changes structurally (paragraph_id added, removed, or renamed). Content fixes inside an existing paragraph do not require version bump but should update `last_updated`.
