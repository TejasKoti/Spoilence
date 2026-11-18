# Spoilence implementation status

Updated 2026-11-17, America/Chicago. **v0.3.2 is built, packaged and locally validated.** The current scope is desktop browser extensions and the self-deployable website. Native Android/iOS apps and executable installers remain removed. The latest contract is in [plan.md](plan.md).

## v0.3.2 reveal overlay and playback

The thumbnail overlay is attached to the card outside the inert media subtree, intercepts clicks over the thumbnail, and has a reveal button 50% larger than v0.3.1. Existing and newly started preview videos in concealed cards are paused without media analysis. A feed fixture with eight protected cards exercises the eighth card, a nested video link, reveal restoration and playback suppression in Chromium, Firefox and WebKit. The full 87 browser checks passed before the final existing-playback pause addition; six focused checks passed after it. Lint, typecheck, 54 unit tests, all 16 standalone ZIP checks and website build passed. Live YouTube and Opera GX validation remain pending.

## Historical v0.3.1 reveal control repair

The thumbnail overlay has a larger reveal button, stops pointer and click propagation to the underlying post, and defers restoration until the click has been dispatched. Feed changes that remove the overlay cause it to be recreated. Blur no longer pauses video elements, allowing a site's hover preview to run while its media remains blurred. Hide continues to stop existing playback. The 16 browser archives and website downloads were rebuilt and synchronized.

Lint, typecheck, 54 unit tests, 84 browser tests, and three focused cross-engine overlay removal/click tests passed. Static website validation passed. The hover behavior depends on the site's own preview implementation and has not been verified on a live YouTube feed.

## v0.3.0 current delivery

- Blur is first and is the default for new installations and reset. Existing deliberate mode preferences remain saved. Blur applies a real 32px Gaussian thumbnail blur, replaces the title with `Spoilence Protected - GTA 6 Leak`, and puts a centered `Reveal Content` button on a transparent thumbnail-sized control layer. Recognized channel, duration and view details remain visible. Unknown spoiler-bearing captions are concealed individually; the former opaque whole-card fallback has been removed. Reveal restores original content and attributes, including recycled cards. Hide still removes the entire item without a placeholder.
- The website demo matches these controls. Other download prompts scroll to `03 / Get Spoilence`; only its selected-browser download opens the terms gate. The closing download section is replaced with a useful controls/privacy section. Six white SVG browser logos and three orange privacy SVG icons replace the text symbols. Exact upstream logo paths fixed malformed SVG arc flags found during browser validation.
- The actual Chromium toolbar popup measures 760px root/body width with no horizontal overflow. The logo loads, and the scrollbar measures 4px with a transparent track. The page keeps its internal dividers without the outer frame. Existing legal checkbox gating and no-JavaScript fallback remain in place.
- Validation: lint, typecheck, privacy audit (22 sources), layout/dependency audit (54 sources), 54 unit tests, and 66 content/popup browser checks passed. Installed Chromium 159, Edge 157 and Firefox 159 checks passed. All 16 ZIPs passed independent extraction, exact runtime inventories and hash checks; an extracted Chrome ZIP loaded in isolated Chromium. Safari on a real Mac remains unvalidated.
- Website validation initially passed 64 of 66 checks; two console checks exposed invalid rounded SVG paths. Exact paths fixed them. All 18 focused checks then passed across Chromium, Firefox and WebKit, covering asset console errors, archive checksums, Blur demo, all 16 routes, setup scrolling/gating and the no-JavaScript download form. Static build verification and Wrangler deployment dry-run passed. The current website has 45 public files, 149,712 source bytes and 2,585,466 total bytes. Nothing was deployed.
- The synthetic 300-card Chromium benchmark measured toggle p95 4.3ms, incremental JavaScript heap 1.08MB and frame interval p95 17.6ms, with zero observed long tasks. This host is not designated low-end hardware, and synthetic fixtures do not prove real-site detection quality or total tab memory.
- Current evidence: `tests/results/v0.3.0-validation.json`, component smoke/benchmark reports, and `tests/results/popup-width.json`. Install the newly extracted v0.3.0 browser ZIP and reload the extension to update its installed code. Product and website remain independent of Trash. Earlier version sections below are historical.

## v0.2.2 visual and download update

- The toolbar popup now requests an intrinsic 760px root width, double the prior 380px. Actual Chromium `chrome.action.openPopup()` was opened and its native target inspected through CDP: body/root 760px, viewport 764px, no horizontal overflow. Its scrollbar is 4px wide with a transparent track. Standalone HTTP previews remain responsive. The first Playwright page-event attempt timed out because native popup targets were not surfaced as normal pages; direct CDP attachment then verified the real toolbar view.
- `Spoilence.png` now supplies local favicon/navigation artwork, popup branding and standard 16/32/48/128px extension and toolbar icons. The popup visibly identifies v0.2.2. Installed extensions must be reloaded from their updated extracted folders; a website refresh alone cannot change their code.
- The website's outer body frame/margins are removed; internal dividers remain. Chromium/WebKit use a 4px thumb with a transparent track; other engines use the standard thin transparent-track fallback.
- Each website download now requires a fresh unchecked terms checkbox. Cancel and Escape do not request the ZIP. Local terms version 2026-11-17.1 covers the AS IS development build, missed-spoiler risk and liability limitations subject to applicable law and nonwaivable rights. No acceptance history is stored. Static required-checkbox forms support JavaScript-disabled browsers. This frontend flow is not server authorization; direct archive URLs remain reachable, and legal enforceability is not certified. The attached archive-project policy was adapted without its unrelated account/donation/game provisions.
- Validation: 66 website checks passed across Chromium, Firefox and WebKit. After final logo/scrollbar/artifact updates, 12 focused download/route/no-JavaScript/acceptance checks passed again, including open-dialog accessibility, fresh consent, cancellation without archive requests and checkbox-required fallback downloads. Three popup accessibility/layout checks passed. All 16 final ZIPs passed standalone extraction/hash/root-manifest tests and an actual isolated Chromium installation. Lint/typecheck, static integrity validation and Wrangler dry-run passed. No deployment occurred. The prior v0.2.0 detection/runtime evidence below remains scoped to unchanged concealment code.
- Current website inventory and archive hashes are recorded in `tests/results/v0.2.2-validation.json`; the native toolbar measurement is in `tests/results/popup-width.json` and preview in `tests/results/ui/native-toolbar-popup.png`.

## Current execution roadmap

| Milestone                 | Progress                                                                                                                    | Remaining validation                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Concealment behavior      | Complete Hide removal, thumbnail Blur, safe titles, metadata preservation, precise own-mutation bookkeeping | Passed unit, recycling/restoration, browser runtime and installed-browser checks |
| Popup redesign            | Website palette, mode radios, three-stop sensitivity, synchronized threshold, site logos, Advanced actions | Passed cross-browser controls, save failure/reset/import and axe checks |
| Browser-specific packages | 16 named ZIPs over three shared family builds, no nested family inside archives | All archives extracted independently, every runtime hash verified; extracted Chromium loaded |
| Website and guide         | Selected-browser download, named ZIP and direct extracted-folder instructions | All 16 setup routes, matching download/checksum and no-JavaScript fallback passed |
| Release evidence          | Current evidence in tests/results/v0.3.0-validation.json | Local checks passed; production gates remain listed separately |

These are local development-build results, not signed-store distribution or a claim of complete live-site coverage. No external deployment has been performed.

## v0.2.0 deliverable contract

`product/<family>/spoilence_<browser-id>.zip` supplies one archive for each of the 16 registry choices. Families are Chromium, Firefox and Safari. Hyphens in IDs are retained, for example `spoilence_opera-gx.zip`. Each ZIP contains only the required extension runtime, including needed font licenses, with `manifest.json` directly at its root. There are no nested family resources, setup guide, README, source tree, native installer or package metadata inside the ZIP.

`product/START-HERE.html`, its assets, the catalog, `READ-ME.txt` and `package-info.json` stay outside the archives. The local guide and website select the correct named ZIP. After extraction, users load the extracted `spoilence_<id>` folder directly; Firefox-type browsers select its root `manifest.json`. Keep the loaded folder in place. Browser consent is always required.

The website copies all 16 archives into `website/public/downloads` during synchronization and downloads only the selected browser's package. Its generated catalog uses top-level `downloads[id]` metadata with filename, product path, extracted folder, family, size and SHA-256. After synchronization, website deployment and the extracted extensions need no backend, source tree, package manager, Trash or original project path. **Trash remains safe to delete.**

Browser routing is distinct from runtime validation. Generic Chromium and Firefox-compatible fallbacks are included. Individual forks may alter API or installation behavior. Firefox unsigned temporary installation must be repeated after restart. Safari is a Mac-only temporary route with actual Mac validation pending. No mobile package, APK, IPA, EXE or signed store release is claimed.

## Historical v0.2.0 behavior and popup

Hide removes the entire detected item from layout and accessibility navigation, leaving no reveal bar or placeholder. Mode changes, site disable and OFF restore original state. Blur applies a real 32px thumbnail blur and the exact safe title `Spoilence Protected - GTA 6 Leak`, preserving recognized channel, views and time details. A conservative opaque cover handles unknown layouts. Deliberate per-item reveal belongs to Blur, not Hide. Raw spoiler text must remain absent from replacement labels and accessibility names.

The popup follows the website's charcoal, warm-white and orange design language. It uses native mode radios, a three-position Aggressive/Balanced/Custom range, Custom threshold range/number controls with 0.01 steps, inline site logos, low-power mode and collapsed Advanced actions. Empty numeric edits retain the last valid value. Existing queued saves, failure rollback, clear, verified imports and confirmed reset are retained.

The popup was visually checked at 380px and 260px with no horizontal overflow. Default site controls fit the 380 x 600 popup; Advanced and Custom sections may scroll. Built-popup previews and actual installed Chromium previews are in `tests/results/ui` and `tests/results/popup-design`.

## Executed v0.2.0 evidence

- Lint, typecheck and all **54 unit/integration/privacy tests passed**. Tests include exact TTL boundaries, source metadata, mode changes, unknown-caption fallback, CSS priority restoration and Instagram/TikTok metadata preservation.
- The full content/popup suite passed **63 cases** across Chromium, Firefox and WebKit. After the final censor-only safety fixes, **9 focused content cases** passed again, including exact CSSOM/clip-path restoration, stable Reveal and recycled title/caption handling. All **18 guide cases** also passed on the final rebuild. Popup tests use a documented mock API bridge; they are separate from installed-extension evidence.
- Installed extension checks passed in **Chromium 159**, **Edge 157**, and **Firefox 159**. Firefox used the Playwright-managed binary driven by verified geckodriver 0.37.1, not a certification of every branded Firefox release. Checks covered concealment, popup OFF/ON, local mutations, settings-only storage and clear/reset. Chromium also checked real keyboard Reveal and zero detection requests. Edge and Firefox reports include final bundle hashes.
- All **16 archives** passed independent extraction, root-manifest, exact-essential-file and complete hash verification. A Chrome archive was extracted outside this repository and loaded into actual Chromium; Hide produced no owned bar or visible card. Chrome is **56,539 bytes**, Firefox **56,274**, Safari **56,184**; same-family aliases reuse identical payloads. Full per-browser hashes are in `product/package-info.json` and `tests/results/package.json`.
- Website: **60 checks passed** in the full three-engine run; three remaining failures were obsolete no-JavaScript copy assertions. The corrected **3 fallback checks passed**. After the final artifact synchronization, **12 focused download/route/demo/fallback checks passed**. The website contains **39 public files**, **2,113,491 total bytes**, **117,209 source bytes**. Static integrity validation and the Wrangler deployment dry-run passed. Nothing was published.
- Privacy audit passed for **22 runtime/guide source files**; layout/branding and active dependency checks passed for **53 source files**. No active artifact or import requires Trash. Temporary test-driver downloads were moved to Trash after checks, outside all deliverables.
- Synthetic performance: local rules p95 **0.0182ms**, cache lookup p95 **0.0005ms**; 300-card Chromium toggle p95 **10.6ms**, incremental JS heap **1.01MB**, frame interval p95 **20.3ms**, zero observed long tasks in that run. JS heap is not total tab memory, and this i5-12500H host is not designated low-end hardware. Synthetic detection data is not representative; Aggressive precision on the small balanced fixture was **85.7%**, so production precision/recall gates remain open.

Failures were corrected rather than skipped: metadata/DOM restoration needed precise own-mutation tracking, canonicalized CSS values required exact restoration bookkeeping, and unknown spoiler-bearing captions/ancestor attributes required conservative protection. Final focused results passed after those fixes. Evidence is recorded in `tests/results/v0.2.0-validation.json` with the component reports.

## Privacy and release gates

Detection remains local with no detection-related network traffic, raw-content persistence or audio/video analysis. Rules and policy use bounded memory-only results with strict age >=24-hour expiration, no sliding lifetime, and lifecycle/settings invalidation. Static OCR/classifiers remain disabled. Only preferences and explicitly imported validated rules may persist.

Open production gates remain: representative >=98% obvious-text recall and >=95% balanced precision, live-site/language/layout coverage, designated low-end latency/total-tab memory/idle/scroll measurements, actual Mac Safari, named-fork runtime checks, store review and signed distribution. Synthetic fixtures and Playwright WebKit do not establish those outcomes. Mobile app gates no longer apply.

## Website and historical evidence

The current website retains the inspected Christen Dijoux reference and later user-directed circular-mound treatment: charcoal/warm-white/orange, tall outlined typography, local licensed fonts, attributed official Rockstar artwork, a circular download card, full-stage reactive halftone field and a 1.6-second outward orange pulse every five seconds. Pointer response settles; hidden/offscreen/reduced-motion states stop animation and timers. The metadata strip, scene selectors and pause switch remain removed. Native scrolling, a static fallback, local assets and the five-row browser picker remain part of the design.

The exact reference is an Awwwards nominee entry, not an established award winner. Successful live inspection confirmed a full-stage reactive dot field. Lab inspection stopped after HTTP 429. Sources and pointer screenshots remain in `website/research/christen-dijoux-reference.md`; research images are not published.

Earlier extension and website runs are historical. The current v0.2.0 component reports and aggregate above supersede their bundle hashes and artifact sizes. See `website/README.md` for user-run preview/deploy commands. Cloudflare serves only `public/`; no deployment or account change was performed.

No actual Safari, physical touch-device, inclusive user/screen-reader study or designated low-end website profiling is claimed. Hosted CI definitions are not evidence of a hosted run.

## Archived material and external cache

Removed native projects and prior product output are archived under Trash. They are not active imports, runtime assets or build inputs. Packaging must check resolved output paths before moving previous products there.

The previously disclosed external Edge test extraction at `C:\Users\Astrio\AppData\Local\Temp\spoiler-shield-edge-c28492d1d139430e8abf611372acbf78` is unrelated to the product. An earlier automatic approval review rejected its recursive cleanup as blocked by policy. No new cleanup attempt is claimed, and deleting project Trash does not remove external development-tool caches.
