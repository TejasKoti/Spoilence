# Spoilence development

Spoilence v0.2.0 runs detection locally in desktop browser extensions. There is no remote backend server.

- `browser-extension`: site adapters, document-start concealment, settings, the charcoal/orange popup and censorship/restoration UI.
- `packages`: reusable rules, normalization, policy, cache and contracts.
- `models`: capability manifests; OCR/classifiers remain disabled.
- `browser-targets.json`: 16 browser choices, three families, setup addresses and honest validation labels. Compatible browsers reuse a family build; new APIs require their own tested target.
- `setup-guide`: local installation guide, copied outside extension ZIPs.
- `tools`: builds, packaging, privacy/layout audits, benchmarks and installed-browser checks.
- `build`: generated bundles and caches, never a source dependency.

Tests live in `../tests`. Removed native projects and prior products in Trash are optional archives, never active inputs.

Use Node 24.x and pnpm 12.21.0. From this folder:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm package
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
pnpm test:product
```

Build before packaging. `pnpm package` creates 16 `spoilence_<browser-id>.zip` archives under `../product/chromium`, `firefox` and `safari`, reusing three compiled payloads. IDs retain hyphens, such as `spoilence_opera-gx.zip`. Every ZIP extracts directly to its runtime: `manifest.json` is at the root alongside scripts, styles, popup and required local fonts/licenses. No guide, README, source, package metadata or native installer is inside a ZIP. The guide, its assets, catalog, `READ-ME.txt` and `package-info.json` remain outside the archives. Old product output is moved to Trash after path checks; Trash is never an input.

The generated metadata contains `downloads[id]` with `filename`, product-relative `path`, extracted `folder`, `family`, `bytes` and `sha256`. `payloads[family]` inventories the runtime files. To refresh the standalone website after packaging, run `npm run sync:product` and `npm run build` from `../website`. Synchronization copies all 16 named archives and verifies their sizes/checksums. The website downloads only the selected browser's ZIP.

The v0.2.0 behavior contract removes detected items completely in Hide mode, with no per-item reveal bar. Blur uses a 32px thumbnail blur plus the exact safe title `Spoilence Protected - GTA 6 Leak`, preserving recognized non-title metadata and using an opaque fallback for unknown layouts. Popup sensitivity is a three-position native range; Custom uses synchronized numeric/range inputs from 0 to 1 with 0.01 steps, commit-time clamping and blank-value protection. Full behavior is specified in `../docs/plan.md`.

Product checks extract browser archives outside the repository, audit root manifests/runtime inventories and hashes, reject links/native or guide/source overhead, and exercise an extracted Chromium payload. Browser routing and mocked popup API checks do not certify every branded browser. Additional commands include `pnpm test:installed`, `pnpm test:firefox-installed`, `pnpm test:edge-installed`, `pnpm benchmark` and `pnpm benchmark:browser`. Keep signed distribution, actual Mac Safari, individual forks and representative low-end/live-site checks as separate release gates.

See `../docs/implementation-status.md` for executed results on the current revision. Older successful runs do not validate v0.2.0 automatically.
