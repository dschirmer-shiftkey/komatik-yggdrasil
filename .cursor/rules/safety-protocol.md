# Safety Protocol

## Hard Rules

1. **No secrets in code or outputs.** API keys, tokens, passwords must never appear
   in committed files. LLM provider keys go in `.env` (gitignored). The Publisher
   service validates outputs before committing.

2. **No political positions.** Agents present evidence and analysis, never opinions
   or advocacy. Findings must be neutral, citation-backed, and reproducible.
   This applies to all Seed missions without exception.

3. **Budget enforcement is non-negotiable.** Every Seed has a hard budget cap
   in `config/bifrost.json`. When the cap is reached, Bifrost returns 429 and agents
   halt until the next billing cycle. Do not work around this by routing LLM calls
   outside Bifrost.

4. **MISSION.md is immutable.** Only David (human) can create or modify a Seed's
   MISSION.md. Agents read it, align to it, and never modify it.

5. **No outbound network access except through approved channels.**
   - LLM calls → Bifrost only
   - Git operations → Publisher only
   - Everything else → blocked by Docker network policy

6. **Agent outputs are public.** Everything committed to this repo is visible to the
   world. Never include proprietary data, PII, copyrighted material without proper
   attribution, or anything that could not be published under CC BY 4.0 / MIT.

## Quality Gates

Before any agent output is published:
1. **Mission alignment** — Mission agent verifies the output advances the stated mission
2. **Quality check** — Documentation agent ensures readability and proper formatting
3. **Secret scan** — Publisher service scans for API keys, tokens, credentials
4. **Format validation** — Publisher verifies TOKENS.md structure

## Circuit Breaker

5 consecutive agent failures trigger a hard stop for the affected Seed.
The gateway sets `circuit_state = 'open'` and no new agent sessions are started
until a human reviews the failure chain and manually resets the breaker.

## Cost Awareness

| Resource | Budget | Enforcement |
|----------|--------|-------------|
| LLM tokens | Per-Seed cap in bifrost.json | Bifrost hard limit (429 on exceed) |
| GitHub API | Publisher rate limits | Built-in backoff in publisher service |
| Compute (VPS) | Fixed monthly per Seed | Infrastructure-level — no agent control |

## Licensing Compliance

- Code outputs: MIT — contributors retain copyright, Komatik retains none
- Research/findings: CC BY 4.0 — attribution required, commercial use allowed
- Third-party data: Must verify license compatibility before incorporating
- Komatik brand assets: All rights reserved — do not include logos or brand marks in agent outputs
