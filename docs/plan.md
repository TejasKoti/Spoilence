# Spoilence implementation specification

Updated 2026-11-17 for **v0.3.0** and the user's latest instructions. Active scope is desktop browser extensions plus the self-deployable website. Android/iOS apps and executable installers are removed. This specification replaces earlier distribution and concealment behavior. Superseded projects in Trash are not dependencies.

## Product contract

GTA VI spoiler protection for YouTube, Instagram and TikTok websites. Global ON/OFF, Blur/Hide, Aggressive/Balanced/Custom sensitivity and per-site preferences. Fresh-install and reset defaults are ON, Aggressive and Blur. Preserve deliberately saved mode choices. Never expose spoiler text in controls, accessible names or diagnostics.

- **Hide:** remove the whole detected item from layout and accessibility navigation. Leave no placeholder, bar or per-item Reveal control. Switching modes, disabling the site or turning protection OFF restores the relevant original content.
- **Blur:** apply a real Gaussian `blur(32px)` directly to thumbnails and replace the title with the exact safe text **Spoilence Protected - GTA 6 Leak**. Preserve channel, views, time and recognized non-title metadata. A transparent, media-sized control layer centers **Reveal Content** on the thumbnail. Never use an opaque whole-card cover. Unmapped potentially spoiler-bearing text receives source-preserving granular replacement while recognized metadata and duration/view/time patterns remain visible. Mask original accessibility attributes and restore them on Reveal/OFF.
- Restore original content, attributes, styles, focusability and accessibility state reliably on mode changes, OFF, reveal and lifecycle cleanup. Recycled or replaced feed content must not inherit another item's title or stale state.

Instant concealment uses document-start CSS and an independent startup guard, synchronous fast text rules, bounded mutation processing, viewport prioritization and failure recovery without locking entire pages. Unknown layouts remain a documented coverage gap. Do not promise catching every spoiler.

## Popup and interaction

Use the website's charcoal, warm-white and orange design language with readable native form controls and an intrinsic 760px native popup. Standalone previews remain responsive at narrow widths. Use a thin transparent-track scrollbar and the supplied Spoilence.png logo for website/navigation/favicon and extension icons. Ship fonts and icons locally.

Provide actual Blur/Hide radio options, with Blur first and selected by default, and accurate mode descriptions. Sensitivity is a three-stop range: Aggressive, Balanced, Custom. Custom exposes a synchronized risk-threshold range and numeric input, both spanning 0 to 1 in 0.01 increments. Clamp finite out-of-range values on commit. Empty or invalid numeric edits retain the last valid threshold and never silently save zero. Keep queued saves, save-failure rollback, per-site checkboxes with inline logos, low-power mode, local decision clearing, integrity-checked rule imports and confirmed full reset functional. Advanced actions can be collapsed. Retain keyboard focus, accessible names, status messages and usable targets.

## Architecture

DOM adapters -> early concealment -> ephemeral normalization -> local versioned rules -> BLOCK/ALLOW/UNCERTAIN -> sensitivity policy -> censorship controller. Bounded memory-only cache with opaque per-item identifiers. Settings and explicitly imported integrity-checked rules are separate from decisions. Dependencies point inward toward pure contracts; browser API differences stay at the adapter/build boundary.

Use TypeScript, the pinned pnpm workspace, minimal vanilla UI/CSS, WebExtensions, Vitest and Playwright. Avoid a heavy frontend framework, WASM or always-loaded ML without measured value. Optional static-image analysis remains capability gated, cancellable, single-job and disabled until representative evaluation and low-end profiling justify it. No thumbnail refetch. **Never implement audio or video analysis.**

## Privacy and strict expiration

No server, accounts, telemetry, analytics, remote inference, automatic downloads or detection-related network traffic. Never persist raw user content, OCR text, images, browsing history, per-item decisions or cache hash secrets. Only non-content preferences and explicitly imported validated rule assets may persist.

Every result expires at age **>=24 hours** from creation. Reads, writes and LRU movement must not extend its life. Check wall/monotonic age on access, clear on clock rollback and resume, schedule cleanup, and start with an empty cache. Bound cache and DOM state. OFF, Clear Data, relevant site disable and permission revocation clear results. Full reset removes preferences and imports. The extension cannot erase websites' or the OS's caches.

## Browser packages and installation

Use `backend/browser-targets.json` as the compatibility registry. There are 16 browser choices across three compiled payloads:

- Chromium: Chrome, Edge, Brave, Opera, Opera GX, Vivaldi and generic Chromium.
- Firefox: Firefox, Firefox ESR, Developer Edition/Nightly, LibreWolf, Waterfox, Zen, Floorp and a generic Firefox-compatible route.
- Safari: Safari on Mac, using the documented Safari 18.4+ temporary installation route. Actual Mac validation remains a release gate.

Each registry ID gets `spoilence_<id>.zip`, retaining hyphens in IDs such as `opera-gx` and `firefox-esr`. Packages live under `product/<family>/`, but **each ZIP contains only essential runtime files, with `manifest.json` directly at its root**. Runtime font assets and required licenses may be included. Do not put a guide, README, package metadata, source tree, installer or native artifact inside an extension ZIP. Identical engine payloads may share archive bytes while keeping browser-specific filenames.

Keep `product/START-HERE.html`, guide assets, `READ-ME.txt`, the generated browser catalog and `package-info.json` outside the ZIPs. The guide chooses the matching named package with an explicit browser override. After extraction, Chromium-compatible browsers load the extracted `spoilence_<id>` folder directly; Firefox-compatible browsers select `manifest.json` directly inside it. Safari uses the extracted Safari folder on Mac. No nested family-folder selection is required. Keep the loaded folder in its permanent location.

Compatibility routing is not runtime validation. Some public browsers lack compatible extension APIs. Mobile installation is outside this release. Never change default browsers, edit profiles or bypass user consent. Firefox unsigned temporary installs must be loaded again after browser restart; Safari's temporary route also has limitations. Do not claim a signed store release or universal browser support.

`package-info.json` records version, families, browsers, per-family file hashes and `downloads[id]` containing filename, relative product path, extracted folder name, family, size and SHA-256. Website synchronization verifies and copies all 16 archives to `website/public/downloads`, then generates the local catalog. The selected browser action downloads only its own named ZIP. Website deployment must remain independent of backend, product and Trash after synchronization.

## Project layout and website

- `product`: three family directories containing the 16 named ZIPs, plus the external local guide and release metadata.
- `backend`: browser-extension, shared packages, models, setup guide, build tools and generated build output. No remote detection server.
- `website`: standalone static assets, copied browser downloads/catalog and Wrangler configuration.
- `tests`: unit, integration, conformance, privacy, e2e, product, website and generated results.
- `docs`: authoritative specification, architecture, privacy, compatibility, performance and implementation status.
- `Trash`: superseded material only, removable and never an active input.

The website follows the user's exact Christen Dijoux reference and later circular-mound direction: charcoal/warm-white/orange, condensed editorial type, large wordmark, circular pitch card and local official GTA artwork with attribution. The orange outward ring repeats every five seconds in finite 1.6-second bursts. Pointer animation settles, quiet gaps have no frame loop, and hidden/offscreen/reduced-motion states stop timers and frames. Preserve static fallback, native scrolling, local assets and the absence of analytics/storage. No metadata strip, scene selector or pause switch. The website is published by the user through Wrangler; routine local work does not authorize external publication.

## Acceptance and validation

- Test complete Hide removal, exact safe Blur title, 32px thumbnail blur, preservation of recognized metadata, granular text protection, centered Blur reveal and full restoration.
- Test initial concealment, adapters, dynamic/recycled content and accessibility state without exposing raw spoiler content.
- Test native popup controls, synchronized threshold values, finite clamping, blank input, queued saves, rollback, imports, clear and confirmed reset.
- Test exact TTL boundaries, non-sliding updates, clock skew, resume, cleanup and capacity.
- Verify offline behavior and extension-owned storage with actual installed extensions and synthetic fixtures; distinguish mocked API tests from installed-browser results.
- Audit every named ZIP outside the repository: root manifest, required runtime assets/licenses, file hashes, no links, no guide/source/native overhead and no dependency on source or Trash. Exercise an extracted Chromium package. Do not present a shared-payload check as validation of every branded browser.
- Check all 16 download/setup routes, browser inference and override, direct extracted-folder instructions, responsive offline guide, copied website archives and matching checksums.
- Target obvious-text recall >=98% on representative held-out data and balanced precision >=95%; report false positives/content types. Small synthetic sets do not prove this.
- Low-end desktop targets: rules p95 <10ms/card, lookup <2ms, toggle <100ms, incremental total tab memory <30MB, near-zero idle CPU and no sustained scroll jank. Separate JS heap from total renderer memory. Measure before claiming success.
- No uncontrolled polling, automatic model loading, detection network traffic or audio/video analysis. OCR stays disabled until it improves measured quality within budgets.
- Signed distribution, actual Mac Safari, each named fork and representative live layouts require independent validation gates. Playwright WebKit is not actual Safari.

Execute the roadmap in `implementation-status.md` incrementally, run appropriate lint/typecheck/unit/build/privacy/layout and browser/product/website checks, fix failures, and record only executed evidence. Routine steps need no approval. Genuine platform limits and remaining gates must stay explicit.
