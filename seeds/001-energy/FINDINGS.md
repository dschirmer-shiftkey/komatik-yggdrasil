# Findings — Seed 001: Energy

> Solving energy poverty via distributed renewables and open hardware

## Executive Summary

**Cycle 001** (2026-04-26) established the baseline landscape for community-scale energy access in sub-Saharan Africa and Southeast Asia. Key headline findings:

- **730 million people** globally still lack electricity (IEA, 2025)
- Solar PV costs have fallen **90% since 2010** — $0.043/kWh LCOE in 2024 — making it the cheapest form of new electricity generation on the planet
- A community microgrid for 100 households in East Africa can be built for **~$91/household** using open hardware (LibreSolar MPPT + BMS + commodity LiFePO4 cells), well under the mission's $500/household target
- The off-grid solar market is growing: PAYGo sales in Sub-Saharan Africa rose **54% YoY** in H1 2025, hitting a record 2.35 million units
- **LibreSolar** is the key open hardware project — active MPPT charge controller (MPPT-2420-HC) and BMS (BMS-C1) designs, Apache-2.0 licensed, KiCad PCB files, firmware updated April 2026
- The hardest unsolved problem is **not technology** — it's governance, financing, and long-term maintenance ownership

---

## Research Cycles

### Cycle 001 — Market Landscape & Reference System Model (2026-04-26)

**Status**: Complete (pending Mission agent review)

**Documents**:
- `RESEARCH/cycle-001-market-landscape.md` — Energy poverty scale, market dynamics, open hardware ecosystem, governance models
- `RESEARCH/cycle-001-reference-system-model.md` — Reference 100-household community microgrid design, BOM, cost analysis, 10-year TCO

**Key findings**:

#### Energy Access Scale
- 730M globally without electricity (IEA 2025)
- Sub-Saharan Africa: <50% electrification in many countries (DRC, Ethiopia, Tanzania rural, Nigeria rural)
- PAYGo solar kit sales hit record 2.35M units in H1 2025 (+54% YoY) as mobile money infrastructure matures
- Market signal: PAYGo overtook cash sales for first time since 2018 — financing access is unlocking demand

#### Technology Assessment
| Technology | Mission fit | Notes |
|------------|------------|-------|
| Solar PV | ★★★★★ | Primary technology, costs at historic lows |
| LiFePO4 batteries | ★★★★☆ | Best 10-year TCO; sourcing improving in SSA |
| Lead-acid batteries | ★★★☆☆ | Widely available, cheaper upfront, degrades faster in heat |
| Micro-hydro | ★★★☆☆ | Site-dependent; relevant for highland East Africa |
| Small wind | ★★☆☆☆ | Supplementary only; solar dominant |
| MPPT charge controllers (LibreSolar) | ★★★★★ | Open hardware, Apache-2.0, actively maintained |

#### Reference System Cost (100-household community microgrid)
- Hardware cost: **$6,400** (7kWp PV + 48V LiFePO4 + LibreSolar MPPT+BMS + distribution)
- Installed cost (with transport, labor, training): **$9,120**
- Per household: **$91**
- Monthly cost over 10 years: **$1.04/household** (vs. $3–5/month for kerosene lamp)
- The $500/household mission target provides substantial headroom for governance infrastructure and contingency

#### Open Hardware
- **LibreSolar MPPT-2420-HC**: 20A, 55Voc, KiCad PCB, Apache-2.0 ✓
- **LibreSolar BMS-C1**: 16s/100A, KiCad, actively maintained ✓
- **LibreSolar BMS firmware**: C, Apache-2.0, supports multiple BMS chips ✓
- Fab feasibility: boards best imported pre-assembled initially; local SMD assembly viable in Lagos, Manila, Jakarta

#### Open Questions (for Cycle 002)
1. Reference BOM validated against component availability in Kenya/Tanzania specifically
2. Minimum viable technician training curriculum
3. Community microgrid governance case studies (5+ year sustainability)
4. Per-household SHS variant design for dispersed communities (>500m between households)

---

## Bibliography

| Source | Description | Cycle |
|--------|-------------|-------|
| IEA (2025) | "Access to electricity stagnates, leaving 730 million in the dark" | 001 |
| GOGLA H1 2025 | "Sub-Saharan Africa: PAYGo sales reach record, while cash sales drop to 5-year low" | 001 |
| IRENA (2025) | "Renewable Power Generation Costs in 2024" — Solar PV at $0.043/kWh | 001 |
| IRENA (2025) | "Renewable capacity statistics 2025" — 1,865 GW global solar PV | 001 |
| LibreSolar | github.com/LibreSolar — MPPT + BMS open hardware | 001 |
| OpenEnergyMonitor | openenergymonitor.org — emonPi2 energy monitoring | 001 |
| GOGLA (2026) | "Leveraging Subsidies to Achieve SDG7 in Humanitarian Settings" | 001 |
| GOGLA (2025) | "Blended Finance for Off-Grid Solar" | 001 |

---
*This file is maintained by the Documentation agent and updated after each research cycle.*
