# DNS and public surfaces (stub)

> **Status:** Decision log + checklist — fill in before configuring DNS or Pages.

## Two public surfaces

```
cairn.komatik.xyz          →  GitHub Pages (static site in /site)
                             NOT the agent Docker stack

seed-002 ???.komatik.xyz   →  TODO: optional VPS endpoint (status only?)
                             OR no public DNS (SSH + logs only)
```

Legacy: `yggdrasil.komatik.xyz` should **301** to `cairn.komatik.xyz` (TODO: confirm redirect host).

## GitHub Pages (site)

| Step | Status | Notes |
|------|--------|-------|
| Enable Pages on `KomatikAI/cairn` | _TBD_ | Settings → Pages → Source: GitHub Actions |
| Workflow | [deploy-site.yml](../../.github/workflows/deploy-site.yml) | Triggers on `main` + `site/**` changes |
| Custom domain | `site/CNAME` → `cairn.komatik.xyz` | |
| DNS `CNAME` at registrar | _TBD_ | Point to GitHub Pages target |
| HTTPS | _TBD_ | GitHub provisions cert after DNS validates |

Last known state: deploy workflow **failed** when Pages was not enabled (not a code defect).

## VPS / seed DNS (optional)

| Record | Type | Target | Purpose |
|--------|------|--------|---------|
| _TBD hostname_ | _A / AAAA_ | _VPS IP_ | **TODO:** public status page? |
| | | | **TODO:** or no public DNS |

The agent stack does not need a public hostname to operate if you operate via SSH and Supabase/GitHub only.

## Open questions

1. Who manages `komatik.xyz` DNS (registrar / Cloudflare / other)?
2. Should the seed VPS have any public HTTP endpoint?
3. Separate staging hostname (e.g. `seed-002-staging.komatik.xyz`)?

## References

- [deploy README](./README.md)
- [vps-staging](./vps-staging.md)
- [vps-production](./vps-production.md)
