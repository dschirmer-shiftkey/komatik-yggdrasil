# Contributing to Komatik Yggdrasil

Yggdrasil is an open initiative. Contributions from researchers, engineers,
domain experts, and anyone passionate about solving global problems are welcome.

## How to Contribute

### Research Contributions

If you have expertise in a Seedling's mission area (energy, food systems, water,
health, education, climate, or community building):

1. Open an issue in the relevant Seedling's directory describing your contribution
2. Include references, data sources, or methodologies
3. The Seedling's Community agent will triage and acknowledge your contribution
4. Quality contributions are integrated into the research pipeline

### Code Contributions

For infrastructure improvements, new tools, or bug fixes:

1. Fork the repository
2. Create a feature branch (`git checkout -b improve/your-feature`)
3. Make your changes
4. Submit a pull request with a clear description

### Reporting Issues

- Use GitHub Issues for bugs, suggestions, or questions
- Tag issues with the relevant Seedling codename (e.g., `seedling:energy`)
- Include as much context as possible

## Guidelines

- **Mission alignment**: All contributions must align with the Seedling's MISSION.md
- **Open access**: Do not submit proprietary data or code with restrictive licenses
- **Respect**: This initiative exists to help people — keep discussions constructive
- **Evidence-based**: Research contributions should cite sources and be reproducible
- **No politics**: Seedlings take no political, ideological, or partisan positions

## Licensing

By contributing, you agree that:

- Code contributions are licensed under [MIT](LICENSE)
- Research and documentation contributions are licensed under [CC BY 4.0](LICENSE-CC-BY-4.0)

## Code of Conduct

Be kind. Be constructive. Remember that the goal is solving real problems for
real people. Harassment, discrimination, and bad-faith participation will not
be tolerated.

## Proposing a New Seedling

Anyone can propose a new seedling. Before proposing, check [tree.yaml](tree.yaml)
to see existing branches and seedlings.

### Scope Rules (Root Trimming)

Each branch defines a **scope floor** — the minimum geographic granularity for
a seedling. Below that level, contributors should join an existing seedling
rather than creating a new one.

| Scenario | Example | What Happens |
|----------|---------|-------------|
| **Below scope floor** | "Van Nuys Homelessness" (floor is metro) | Redirected to contribute to LA Homelessness |
| **Same scope, same geography** | Another "LA Homelessness" | Contribute to the existing seedling |
| **Broader scope, contains existing** | "California Homelessness" | Merge discussion — absorb or aggregate |
| **Same scope, different geography** | "Tokyo Homelessness" alongside "LA Homelessness" | Allowed — new seedling |
| **Different branch** | "LA Education" | Allowed — different problem domain |

### Proposal Process

1. Open a GitHub issue titled "Seedling Proposal: [Name]"
2. Include: problem statement, geographic scope, data sources, and why a new
   seedling is needed (vs. contributing to an existing one)
3. A maintainer checks scope rules against `tree.yaml`
4. If approved, the contributor (or maintainer) creates the seedling directory
   and submits a PR following the structure in the
   [development protocol](.cursor/rules/development-protocol.mdc)

### Alternative Ways to Contribute

If your proposal overlaps with an existing seedling:
- **Sponsor compute** — fund additional token budget for the seedling
- **Contribute research** — open issues with data, case studies, or expertise
- **Propose a different branch** — your geographic area may need a different
  kind of help (energy, education, food security)
- **Add to shared findings** — contribute to the branch-level knowledge base

## Questions?

Open an issue or reach out via [komatik.ai](https://komatik.ai).
