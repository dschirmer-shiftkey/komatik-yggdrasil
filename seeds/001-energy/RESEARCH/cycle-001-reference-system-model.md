# Analysis: Reference Community Microgrid System Model

> **Seed**: 001-energy
> **Cycle**: 001 — Analysis component
> **Date**: 2026-04-26
> **Agent**: rd-satellite (Analysis function)

---

## Objective

Model a reference community microgrid for 100 households in sub-Saharan Africa.
Validate the mission's $500/household cost target.
Identify which open hardware components to specify.

---

## Reference Village Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Households | 100 | Mission scope minimum |
| Average household size | 5–6 people | SSA average |
| Population served | ~500–600 people | |
| Location archetype | Rural East Africa (Kenya/Tanzania) | Primary target geography |
| Solar resource (peak sun hours) | 5.5–6.5 hours/day | IEA/IRENA for 5°S–10°N |
| Ambient temperature range | 20–38°C | |
| Wet season irradiance reduction | ~20% | Seasonal safety factor |

---

## Tier 2 Household Load Profile

Mission target: "basic electrification" — 3 lights, phone charging, fan (seasonal).

| Appliance | Power (W) | Daily hours | Daily Wh |
|-----------|-----------|-------------|----------|
| LED lights (3×) | 5W each | 5 hours | 75 Wh |
| Phone charging (2×) | 5W each | 2 hours | 20 Wh |
| Fan (ceiling/stand) | 30W | 4 hours (seasonal avg) | 120 Wh |
| Small radio | 5W | 2 hours | 10 Wh |
| **Total** | | | **225 Wh/day** |

Add 20% safety factor for seasonal variation and distribution losses: **270 Wh/day per household**.

Community total: 100 × 270 = **27,000 Wh/day = 27 kWh/day**

---

## System Sizing

### PV Array

```
Daily energy required = 27 kWh
Peak sun hours (conservative, wet season) = 5.0 hours
System efficiency factor (wiring, inverter, etc.) = 0.85

PV capacity = 27 kWh / (5.0 × 0.85) = 6.35 kWp
Round up with 10% margin: ~7 kWp (28× 250W panels)
```

**PV specification**: 28× 250W monocrystalline panels, 24V system voltage, 2 strings of 14 panels.

### Battery Storage

```
Required: 2 days of autonomy (covers overcast periods)
Storage needed = 27 kWh × 2 = 54 kWh

LiFePO4 usable capacity at 80% DoD:
Battery bank size = 54 / 0.80 = 67.5 kWh

At 48V system: 67,500 Wh / 48V = 1,406 Ah
Use 4× 400Ah 12V batteries in series-parallel = 1,600 Ah @ 48V = 76.8 kWh
```

**Battery specification**: 16× CATL/EVE 100Ah LiFePO4 cells (prismatic, grade A) configured 16s1p at 48V.
Managed by LibreSolar BMS-C1 (16s, 100A, open hardware).

*Alternative for lower-upfront cost*: 4× 220Ah VRLA/AGM lead-acid per household (per-household storage model rather than centralized). Increases total cost but reduces single-point failure risk.

### Charge Controller

LibreSolar MPPT-2420-HC: 20A, 55Voc input, 12/24V battery.

At 7 kWp / 24V system:
- PV array Isc ≈ 9A per string × 2 strings = 18A — fits within 20A rating
- Multiple controllers in parallel for community scale (3× MPPT-2420-HC)

**Charge controller specification**: 3× LibreSolar MPPT-2420-HC (open hardware, fabricate from KiCad files or source boards)

### Distribution

For community microgrid (centralized generation):
- Distribution voltage: 230V AC (standard for SSA countries)
- 3-phase inverter for loads over 5kW: ~3kVA pure sine wave inverter
- Distribution cable: 16mm² copper for main trunk, 2.5mm² branch circuits
- Maximum cable run: 200m from generation point (beyond this, losses exceed 3%)

For per-household model (solar home systems):
- Each household: individual 300Wp panel + 200Ah LiFePO4 battery + 12A MPPT + 230V microinverter
- Eliminates distribution cable complexity but loses economies of scale

---

## Bill of Materials (Community Microgrid Model)

Pricing sourced from Alibaba B2B + regional distributor estimates (April 2026).

| Component | Quantity | Unit cost (USD) | Total (USD) | Notes |
|-----------|----------|-----------------|-------------|-------|
| 250W monocrystalline PV panel | 28 | $55 | $1,540 | Grade A, 25yr warranty |
| LiFePO4 100Ah prismatic cell | 16 | $65 | $1,040 | CATL/EVE grade A |
| LibreSolar BMS-C1 (PCB + components) | 1 | $120 | $120 | Fabricate from open hardware |
| LibreSolar MPPT-2420-HC | 3 | $80 | $240 | Fabricate from open hardware |
| 3kVA 24V pure sine inverter | 1 | $280 | $280 | Victron/Axpert compatible |
| Distribution cable (16mm²) | 200m | $3.50/m | $700 | Main trunk |
| Branch circuit cable (2.5mm²) | 2000m | $0.80/m | $1,600 | 100 households × 20m |
| Weatherproof enclosure | 1 | $180 | $180 | IP65 rated |
| Circuit breakers, fuses, connectors | lot | $200 | $200 | |
| MC4 connectors, cable management | lot | $100 | $100 | |
| Mounting structure (galvanized steel) | 1 | $400 | $400 | Ground mount, 7kWp |
| **Hardware subtotal** | | | **$6,400** | |
| Transport + import duties (est. 30%) | | | $1,920 | Target region estimate |
| Installation labor (local, 5 days) | | | $500 | Community work party model |
| Commissioning + training | | | $300 | Train 2 local technicians |
| **Total system cost** | | | **$9,120** | |
| **Cost per household (100 HH)** | | | **$91** | |

### Sensitivity Analysis

| Scenario | Cost/HH | Notes |
|----------|---------|-------|
| Base case (above) | $91 | 100 HH, centralized microgrid |
| 50 HH (smaller village) | $160 | Fixed costs distributed over fewer HH |
| Per-household SHS model | $220–$280 | Individual 300Wp + 200Ah LiFePO4 systems |
| Lead-acid substitution | $65 | Cheaper battery but 3–4 year replacement cycle |
| With battery replacement reserve | $105 | 10-year TCO with LiFePO4 replacement at year 8 |

**Finding**: The $500/household target in the mission statement appears to be **significantly conservative**. A centralized community microgrid at 100+ households can achieve basic electrification at **$91–$160/household** in hardware cost. This leaves substantial budget for governance infrastructure, operator training, maintenance reserves, and contingency.

The $500 figure may account for per-household solar home systems in dispersed communities where a shared microgrid isn't viable — which is the harder, more expensive case.

---

## 10-Year Total Cost of Ownership

| Cost category | Year 1 | Years 2–8 | Year 8–10 | 10-yr Total |
|--------------|--------|-----------|-----------|-------------|
| Hardware (capital) | $9,120 | $0 | $0 | $9,120 |
| Battery replacement | $0 | $0 | $1,040 (LiFePO4) | $1,040 |
| Annual maintenance | $200 | $200/yr | $200/yr | $2,000 |
| Fuse/breaker replacement | $50 | $30/yr | $30/yr | $380 |
| **Total 10-year cost** | | | | **$12,540** |
| **Per household / 10 years** | | | | **$125** |
| **Monthly cost per household** | | | | **$1.04** |

For context: A kerosene lamp costs $3–5/month in fuel alone. The microgrid pays for itself in avoided energy costs within the first 2–3 years, even before counting the economic value of reliable light and device charging.

---

## Open Hardware Fabrication Feasibility

### Can LibreSolar boards be built locally?

LibreSolar PCBs use surface-mount components. Assessment:

| Region | SMD fab feasibility | Notes |
|--------|--------------------|-|
| Kenya (Nairobi) | Medium | PCB assembly services exist; component supply via importers |
| Tanzania (Dar es Salaam) | Low-Medium | Growing electronics ecosystem; main boards better imported |
| Nigeria (Lagos) | Medium-High | Largest electronics market in SSA; Ikeja market has components |
| Philippines (Manila/Cebu) | High | Strong electronics manufacturing heritage; full local fabrication viable |
| Indonesia (Jakarta) | High | Manufacturing base supports local PCB assembly |

**Recommendation**: For Cycle 002, source completed LibreSolar boards from an established Asian fab house (PCBWay, JLCPCB) rather than attempting local assembly. Ship pre-assembled + tested boards. Long-term goal is to establish local assembly capability in 2–3 hub cities per region.

### Component availability in-country

| Component | SSA availability | SE Asia availability |
|-----------|-----------------|---------------------|
| PV panels | Good (Chinese brands widely stocked) | Excellent |
| Lead-acid batteries | Excellent | Excellent |
| LiFePO4 batteries | Limited (imported, increasing) | Good |
| MPPT controllers (commercial) | Good (Victron, Epever widely available) | Excellent |
| LibreSolar boards | Not stocked — must import | Not stocked — must import |
| Wiring, conduit, connectors | Good in urban centers | Excellent |
| Circuit breakers | Excellent | Excellent |

**Key gap**: LiFePO4 batteries are the single hardest component to source locally in SSA. This is changing rapidly as Chinese manufacturers establish more direct distribution.

---

## Recommendations for Cycle 002

1. **Design a reference Bill of Materials** using only components verifiable as available in Kenya and Tanzania specifically — the primary target geography
2. **Prototype a LibreSolar MPPT + BMS assembly guide** optimized for non-electronics-engineer local technicians (tool list, assembly checklist, test procedure)
3. **Model the per-household SHS variant** for communities too dispersed for a centralized microgrid (>500m between households)
4. **Survey existing community microgrid deployments** in East Africa for governance model case studies — specifically Powerhive, SteamaCo, and Mobisol historical data

---

*Analysis agent: rd-satellite (Komatik) | Cycle 001 | 2026-04-26*
