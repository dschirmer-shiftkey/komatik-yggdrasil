# Research Cycle 001 — Energy Access Market Landscape

> **Seed**: 001-energy (Sub-Saharan Africa & SE Asia Energy Access)
> **Cycle**: 001
> **Date**: 2026-04-26
> **Agent**: rd-satellite (Research function)
> **Status**: Complete — pending Mission review

---

## Summary

This is the first research cycle for Seed 001. It establishes a baseline understanding of:
1. The current state of energy poverty (scale, geography, trends)
2. Market dynamics in the off-grid solar sector
3. The open hardware ecosystem for distributed renewable systems
4. Technology options and their suitability for the target mission

---

## 1. Energy Poverty: Current Scale

**730 million people** globally lack access to reliable electricity as of 2025 (IEA). Sub-Saharan Africa accounts for the largest concentration of energy-poor populations. Southeast Asia has significant gaps in rural and remote island communities.

### Sub-Saharan Africa

Sub-Saharan Africa remains the epicenter of energy poverty. Electrification rates vary dramatically by country but remain below 50% in many nations — particularly in the Democratic Republic of Congo, Ethiopia, Tanzania, Nigeria (rural), and Niger.

Key drivers of the access gap:
- **Grid extension economics**: Dispersed rural settlements make centralized grid extension cost-prohibitive ($1,000–$2,500/household at scale vs. $200–$500 for off-grid solar)
- **Utility financial weakness**: Many national utilities lack capital for expansion; where grids exist, quality is poor (frequent outages, low voltage)
- **Purchasing power constraints**: Per-capita incomes in target communities are often under $3/day, limiting upfront capital even for low-cost systems

### Market momentum

GOGLA's H1 2025 data shows a meaningful inflection:

- **PAYGo solar kit sales rose 54% YoY** in Sub-Saharan Africa, reaching a record **2.35 million units**
- For the first time since 2018, **PAYGo overtook cash sales** — signaling growing financial infrastructure
- Cash sales dropped **35% to 1.44 million units** (lowest since COVID-19 pandemic)
- Overall appliance sales grew **26% YoY** — fans in West Africa are the primary driver
- Overall market flat (+1%) vs. H2 2024 — seasonal trend rather than structural decline

**Interpretation**: The shift toward PAYGo reflects growing mobile money infrastructure and consumer credit access in SSA. This is a positive systemic signal. The drop in cash lantern sales (entry-level products) is concerning for last-mile access but reflects market maturation toward larger, more impactful systems.

### Southeast Asia

Indonesia, Philippines, and Myanmar have significant off-grid populations on remote islands and in mountainous terrain. Island geography makes grid extension especially uneconomical. The Philippines has achieved relatively high electrification (~93%) but quality and reliability remain issues. Indonesia's 17,000+ islands create inherent access challenges. Myanmar's conflict situation complicates grid-based solutions.

---

## 2. Technology Options

### Solar PV (Primary Technology)

Solar PV is the clear primary technology for the mission target regions.

**Cost trajectory** (IRENA 2025 data):
- Utility-scale LCOE: **$0.043/kWh** in 2024 (down from $0.417/kWh in 2010 — **90% cost reduction**)
- Solar PV is now **41% cheaper than fossil fuel alternatives**
- Over **1,865 GW** of global installed capacity by end of 2024; **451 GW added in 2024 alone**
- Solar PV surpassed hydropower as the largest renewable source in 2023

For community-scale systems (10–500 households), relevant configurations:
- **Tier 1** (very small: single household, 11–20 Wp): Solar lantern + USB charging. Cost: $30–$80. Appropriate for ultra-low income entry point.
- **Tier 2** (small household: 20–50 Wp): Powers 3-4 lights + phone charging + small fan. Cost: $80–$200. The PAYGo market sweet spot.
- **Tier 3** (medium household: 50–200 Wp): Adds refrigeration-sized appliances, TV, pump. Cost: $200–$600.
- **Tier 4** (community microgrid: 2–50 kWp): Powers 50–500 households from shared infrastructure. Cost: $500–$2,000/connected household depending on grid density.

**Mission alignment**: Tier 2–3 for household access; Tier 4 for community microgrid designs. Cost target of $500/household is achievable at Tier 3–4 using open hardware components.

### Energy Storage

Two dominant chemistries for the target context:

**Lead-acid (VRLA/AGM)**:
- Pros: Available everywhere, locally serviceable, well-understood, low upfront cost (~$100–$150/kWh)
- Cons: Heavy, 300–500 cycle lifespan, sensitive to high temperatures (degrades faster in tropical climates), requires careful DoD management
- Verdict: Good for immediate deployability in Year 1; known failure mode is premature replacement cost

**Lithium Iron Phosphate (LiFePO4)**:
- Pros: 2,000–4,000+ cycles, better temperature tolerance than other Li-ion, no thermal runaway risk, lighter
- Cons: Higher upfront cost ($200–$350/kWh), requires BMS, less familiarity in target regions
- Verdict: Better lifetime economics for 5–10 year systems; requires BMS open hardware (LibreSolar is the key resource)

**Mechanical storage** (gravity, compressed air): Not yet cost-competitive at community scale for tropical climates; exclude from Cycle 001 scope.

### Micro-hydro

Viable where rivers and streams exist with sufficient head (>2m). Found in highland Ethiopia, DRC, Rwanda, Uganda, Myanmar, Philippines mountain regions. Relevant for communities with perennial water access. Not universally applicable — site-dependent.

### Small Wind

Generally not the primary technology for the sub-Saharan flatland and coastal zones in the target scope. Exceptions: East African highlands, some Southeast Asian island locations with consistent trade winds. Include as supplementary to solar-dominant systems.

### Biogas

Relevant for agricultural communities with animal waste. Primarily for cooking (displacing firewood), secondarily for electricity via generator. Limited electrical output; covered separately.

---

## 3. Open Hardware Ecosystem

### LibreSolar

**URL**: https://github.com/LibreSolar | https://libre.solar

LibreSolar is the most mature open-source hardware project for off-grid solar power electronics. All designs are Apache-2.0 or CC-BY-SA-4.0 licensed — compatible with the mission's open requirements.

Key components:

| Component | Repo | Specs | Status |
|-----------|------|-------|--------|
| MPPT Charge Controller (mppt-2420-hc) | LibreSolar/mppt-2420-hc | 20A, 55Voc input, 12/24V battery, CAN bus, KiCad | Active (⭐113) |
| MPPT Charge Controller Firmware | LibreSolar/charge-controller-firmware | Zephyr RTOS, multi-board, Apache-2.0 | Active (⭐175, updated Apr 2026) |
| BMS 16s/100A (bms-c1) | LibreSolar/bms-c1 | 16s, 100A, KiCad PCB | Active (⭐206) |
| BMS Firmware | LibreSolar/bms-firmware | Supports bq769x0, bq769x2, ISL94202, C, Apache-2.0 | Active (⭐219, updated Apr 2026) |
| Small MPPT (mppt-1210-hus) | LibreSolar/mppt-1210-hus | 12A, dual USB, KiCad | Active (⭐77) |
| BMS-8s50-IC | LibreSolar/bms-8s50-ic | 12V-24V, ISL94202, compact | Active (⭐40) |

**Assessment**: LibreSolar covers the two hardest components (MPPT charge controller + BMS). Both have active development (latest commits April 2026). Designs are KiCad-based (open-source EDA), which allows local fabrication via services like PCBWay or local fab houses.

**Critical gap**: LibreSolar designs are for technically literate builders. Assembly requires SMD soldering and basic electronics knowledge. This is manageable with a "train the trainer" model but needs explicit documentation for the mission context.

### OpenEnergyMonitor

**URL**: https://openenergymonitor.org

emonPi2: 6-channel energy monitor with integrated Raspberry Pi. Primarily designed for building energy monitoring in the Global North context but applicable for microgrid monitoring/management.

**Assessment for mission**: Useful as the monitoring layer for community microgrids. CT sensors (current transformers) are the sensing elements — these are widely available. EmonCMS provides local data logging. Somewhat over-engineered for basic energy access contexts; simpler monitoring solutions may be more appropriate.

---

## 4. Community Microgrid Governance Models

The technology is only half the problem. Community ownership and governance is where most microgrid projects fail. Key models from the literature:

### Energy Cooperative

- Community owns the generation and distribution assets
- Members pay into a collective fund for maintenance and replacement
- Elected management committee handles procurement and billing
- **Pros**: Long-term sustainability, community investment in maintenance
- **Cons**: Requires social capital and trust, vulnerable to political shifts

### PAYG-as-a-Service (Operator Model)

- External operator owns hardware, community pays per-unit consumption
- Operator handles maintenance, replacement, billing
- Mobile money integration (M-Pesa, Wave, Airtel Money) enables micro-payments
- **Pros**: No upfront community capital required, professional maintenance
- **Cons**: Creates dependency, profits flow out of community, vulnerable to operator failure

### Hybrid / Community-Operator Partnership

- Community owns land/infrastructure, operator provides management services under contract
- Operator trains local technicians who eventually take over
- Revenue stays in community after training period
- **Emerging best practice** per GOGLA and ESMAP research

### Tariff structures

Standard structures seen in successful deployments:
- **Flat rate**: Fixed monthly fee for capped consumption. Simple, but doesn't scale with usage.
- **Tiered rate**: Block pricing — first X kWh cheap, additional kWh at higher rate. Encourages efficiency.
- **PAYG with credit scoring**: Mobile-money-integrated, auto-disconnect on non-payment. Reduces theft/default risk.

---

## 5. Key Organizations and Resources

| Organization | Role | Relevance |
|---|---|---|
| GOGLA | Off-grid solar industry association, market data | Primary market data source |
| IRENA | Renewable energy cost/capacity data | Solar PV cost curves, technology assessment |
| IEA | Energy access statistics | Baseline access numbers |
| ESMAP/World Bank | Mini-grid research, Global Facility on Mini Grids | Best practice governance |
| SEforALL | SDG7 tracking, policy advocacy | Status dashboards |
| LibreSolar | Open hardware — MPPT + BMS | Core hardware design source |
| OpenEnergyMonitor | Open hardware — monitoring | Monitoring layer |
| Energypedia | Practitioner wiki — field notes | Field deployment case studies |
| OSHWA | Open-source hardware standards | Hardware licensing guidance |

---

## 6. Key Findings for Mission

### What works

1. **Solar PV + PAYGo financing** is the proven model at Tier 2–3 scale (household). Market growing rapidly.
2. **Mobile money** is the financial infrastructure unlock — without it, PAYGo doesn't work. Coverage is now sufficient in target regions (Kenya, Tanzania, Ghana, Uganda have >70% mobile money penetration).
3. **LibreSolar components** cover the hardest open hardware gaps (MPPT + BMS). Both actively maintained, Apache-2.0 licensed.
4. **LiFePO4 batteries** are the right chemistry for 5-10 year system lifetime in tropical climates. The upfront premium pays back in avoided replacement cost.

### What doesn't work

1. **Cash sales** are declining — community-owned systems need financing mechanisms, not just hardware
2. **Grid extension** is not the answer for dispersed populations. Off-grid is the right approach.
3. **External-only management** (pure operator model) creates unsustainable dependency. Hybrid models perform better long-term.
4. **Lead-acid batteries in tropical climates** are the primary failure mode in existing deployments — degradation accelerates above 35°C.

### Open research questions (for future cycles)

1. **Cost breakdown for a reference 5kWp community microgrid** using LibreSolar + locally-sourced panels + LiFePO4. Target: validate $500/household target.
2. **Minimum viable technical training curriculum**: What does a local technician need to know to operate and maintain a LibreSolar-based system?
3. **Case studies of successful community governance**: Which models show >5 year operational sustainability?
4. **BOM with Alibaba/local sourcing**: Can all LibreSolar components be sourced in-country in target regions?

---

## 7. Sources

| Source | Citation |
|--------|---------|
| IEA | "Access to electricity stagnates, leaving 730 million in the dark" — 2025 commentary |
| GOGLA | "Sub-Saharan Africa: PAYGo sales reach record, while cash sales drop to 5-year low" — H1 2025 Market Report |
| IRENA | "Renewable Power Generation Costs in 2024" — Solar PV LCOE data, June 2025 |
| IRENA | "Renewable capacity statistics 2025" — 1,865 GW solar PV global installed capacity |
| LibreSolar | GitHub organization: github.com/LibreSolar — MPPT and BMS firmware/hardware |
| OpenEnergyMonitor | openenergymonitor.org — emonPi2 energy monitoring system |
| GOGLA | "Leveraging Subsidies to Achieve SDG7 in Humanitarian Settings" — March 2026 |
| GOGLA | "Blended Finance for Off-Grid Solar" — 2025 |

---

*Research agent: rd-satellite (Komatik) | Cycle 001 | 2026-04-26*
