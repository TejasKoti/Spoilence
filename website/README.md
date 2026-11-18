# Spoilence website

A self-contained static website whose current art direction follows the user's exact [Christen Dijoux portfolio reference](https://www.awwwards.com/sites/christen-dijoux-portfolio), with the user's later request for a circular download card over a raised mound that resonates outward in brand orange every five seconds. A thin editorial frame, tall stacked typography with an outlined middle line, a large original SPOILENCE signature and a full-stage reactive halftone field form the opening. The metadata strip and separate shield emblem have been removed. Black and warm white lead the interface, with peach-orange accents. The official GTA VI background remains local and attributed. The page uses normal document flow, with no sticky scroll story, cursor censorbox, water effect, location selector or motion switch.

## Deploy it yourself

Current downloads are v0.3.0. Every website download opens a terms dialog with an unchecked acceptance checkbox. Cancel or Escape starts no download. Acceptance resets for each request and is never stored. Full terms are at `public/terms.html`, version `2026-11-17.1`; `scripts/build.mjs` generates a no-JavaScript `download.html` with required-checkbox forms for all 16 browsers. This is a static website consent flow, not server authorization: direct archive URLs remain accessible, and no durable acceptance evidence or enforceability guarantee is claimed.

From this folder, with Node 24 or later:

```powershell
npm ci
npm run build
npx wrangler deploy
```

Wrangler will handle your Cloudflare login/account selection if needed. Set `name` in `wrangler.jsonc` to your preferred Worker name before deploying. No account ID, API token, custom domain or secret is checked into this project. You handle publication; no live deployment was performed here.

The config uses **Cloudflare Workers Static Assets**, not an application server. Wrangler uploads **only `public/`**. `npm run build` validates the ready-to-serve assets, named-download checksums, local references, source-size budget and absence of native artifacts; there is no frontend compilation step. After product synchronization, you can deploy this website folder independently of `backend`, `product` and `Trash`: all browser archives and the catalog are local to `public`.

For local preview:

```powershell
npm run dev
```

Open **http://127.0.0.1:8787**. Use the local server instead of opening the HTML with `file://`; asset paths are rooted at `/` for deployment. `npm run check:deploy` validates Wrangler's deployment bundle with `--dry-run`, without publishing. Optional alternate Cloudflare Pages deployment: `npx wrangler pages deploy public --project-name YOUR_PROJECT_NAME` after creating/selecting that Pages project; the provided configuration targets Workers.

## Updating the extension downloads

Spoilence v0.3.0 uses 16 browser-named ZIPs, copied into `public/downloads` from three shared family builds. The browser menu downloads only the selected browser's archive, such as `spoilence_brave.zip` or `spoilence_opera-gx.zip`. Each ZIP contains essential extension runtime files with `manifest.json` at the root. Extract it into its permanent named folder, then load that folder directly; Firefox-type browsers select the manifest inside it. There is no nested family-folder choice or guide inside the ZIP. The site does not fetch releases or depend on a development server.

After running the current browser build and `pnpm package` from `../backend`, run:

```powershell
npm run sync:product
npm run build
```

The optional sync command reads `../product`, verifies each archive against `package-info.json`, copies all 16 named ZIPs and metadata, and regenerates the local browser catalog. The catalog records release version and top-level `downloads[id]` entries with filename, product path, extracted folder, family, bytes and SHA-256. Existing synchronized website builds and deployment do not require that source folder. Never replace an archive without updating its metadata.

## Files and maintenance

- `public/index.html`, `styles.css`, `cinematic.css`, `app.js`: page layout, reference-led typography, product demo and browser setup; no React or runtime framework.
- `public/browser-picker.js`, `browser-picker.css`: progressive custom browser selector, five visible rows and an internal scrollbar; the native select remains the data source and no-JavaScript fallback.
- `public/reactive-scene.js`: original WebGL 1 halftone field, embedded shaders, bounded pointer response and periodic outward resonance. It uses a single full-stage quad, with no graphics framework, image sampling or simulation buffers. The static circular-mound SVG fallback is authored in `index.html`.
- `public/assets/gta-vi-*.jpg`: official GTA VI environmental artwork. Copyright remains with Rockstar Games. Asset sources and attribution are in `artwork-source.txt`.
- `public/assets/fonts`: current typography uses self-hosted Big Shoulders Display, Inter and JetBrains Mono, with their upstream licenses. Big Shoulders supplies the tall display lettering; Inter and the mono face retain readable body copy and technical labels.
- `public/privacy.html`, `404.html`, `_headers`: privacy disclosure, genuine 404 page, CSP and security headers.
- `public/browser-catalog.js`: generated browser-family routing and package facts.
- `scripts`: optional product synchronization and static validation.
- `research/christen-dijoux-reference.md`: the current reference study, inspected Awwwards stills, successful live pointer screenshots, verified font roles and adaptation notes. It records the later Lab rate-limit response and unverified implementation details. Older studies, including `experimental-rebuild.md`, record superseded directions. Reference JPEGs in `research` are study material and are never published by Wrangler.
- Tests are separate in `../tests/website`; generated results and previews are in `../tests/results`.

Font upstreams: [Big Shoulders Display](https://github.com/google/fonts/tree/main/ofl/bigshouldersdisplay), [Inter](https://github.com/rsms/inter) and [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono). The Big Shoulders download source, license and checksum are recorded in `research/big-shoulders-font-provenance.json`. The current design reference is [Christen Dijoux's portfolio](https://christendijoux.com/), with [verified research notes](research/christen-dijoux-reference.md). Its Awwwards listing is a nominee entry, not evidence of a winner title. Earlier research includes Rockstar, Codrops and other interactive sites; see each study for inspection limits.

## Interaction and privacy

The opening is a normal-flow editorial composition. Its statement reads "Your first. / Your story. / Your rules.", with the middle line outlined. A large self-authored SPOILENCE wordmark anchors the lower edge. The circular pitch card contains real download and demo links, stays stable as the field moves, and joins normal document flow on smaller screens. The card caps at 368px on desktop and uses 70.4vw on phones; the mound's extent is 1.8 times the card width so its texture extends beyond the card between pulses.

The decorative background is an original WebGL 1 surface covering the hero. Its circular raised mound sits beneath the circular pitch card; the shader measures the card's real position and size on resize so their centers stay aligned. Dense ordered halftone marks and the sparse background lattice react together to fine-pointer movement, which changes lighting and local bending without moving the center. Every five seconds, a raised **#FDBA74** orange ring travels outward beyond the card over a 1.6-second pulse. The mound remains raised at its center. The shader is transparent over the local GTA image and never samples it.

Pointer motion uses elapsed-time damping and settles within 650ms of the last pointer input. The requested periodic resonance uses a five-second timer, with animation frames only during the pulse or an unsettled pointer response; quiet gaps have no rendering loop. Pointer movement does not restart the pulse cadence. Leaving the viewport, hiding the document, enabling OS reduced motion or losing the WebGL context clears both frames and the periodic timer. Resuming starts a fresh five-second wait without catching up missed pulses. The drawing buffer is limited to 700,000 pixels and a pixel ratio of 1.25. Missing WebGL, context initialization errors, shader compilation/linking failure or context loss leave a designed static circular-mound SVG visible; context restoration attempts to rebuild the renderer. Reduced motion keeps the field static.

Touch and keyboard users retain ordinary scrolling and document navigation; no essential action depends on moving the artwork. There is no pinned scroll sequence, image sampling, screen capture, video/audio processing, custom cursor, location selector or pause switch. This is a self-authored interpretation of the reference's spatial language. No reference shader, source code or signature graphic is copied into the runtime.

The separate demo uses fictional content. It does not run the extension or claim to detect website content. The v0.3.0 extension's Hide mode removes a whole detected item without a reveal bar; mode changes or OFF restore it. Blur applies a real 32px thumbnail blur and the exact safe title `Spoilence Protected - GTA 6 Leak`, preserving recognized channel, views and time details with a transparent centered Reveal Content control and granular text protection for unmapped captions. The redesigned popup retains native controls and safe threshold editing. Downloads remain development extensions, with unsigned temporary Firefox installation, Mac-only temporary Safari setup and pending individual-fork validation.

The site contains no analytics, cookies, browser storage, third-party embeds, font CDNs, external runtime requests, camera access or media analysis. Hosting still receives ordinary page/download requests: [the public privacy page](public/privacy.html) explains that distinction. CSP `connect-src 'none'` blocks runtime network APIs. Source and research files are outside the asset directory. Keep Cloudflare-injected analytics disabled if you want the deployed site to retain that property.

## Validation

The browser dropdown shows five 56px rows at a time, with all 16 choices available through internal scrolling. It supports arrows, Home/End, Enter/Space, Escape, Tab and type-to-select. Popup placement stays within the viewport and can open above the control. Keyboard focus stays on the combobox while `aria-activedescendant` identifies the active option. The [WAI select-only combobox guidance](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/) informed the interaction model; automated checks do not replace manual assistive-technology testing.

From `../backend`, after `pnpm install --frozen-lockfile` and this folder's `npm ci`:

```powershell
pnpm exec playwright install chromium firefox webkit
pnpm test:website
```

The suite starts an isolated local Wrangler server on port 8791, leaving the user's preview on 8787 alone. Its checks cover actual drawing changes under pointer input, the static WebGL fallback and context recovery, reduced-motion behavior, pointer settling, periodic pulse timing and quiet gaps, buffer limits, normal-flow layout, absence of removed controls and em dashes, headers, all 16 browser choices, actual ZIP download/checksum, demo accessibility/restoration, clipboard recovery, privacy/404 routes, no-JS fallback, same-origin requests, empty storage/cookies and widths from 320 to 1440px. It also includes axe-core scans of the normal page, open controls, mobile layout, privacy and 404 pages. A 720px viewport is a zoom-equivalent layout-width check, not an assistive-technology certification. These describe the intended test coverage; consult the implementation status for executed results on the current revision.

Synthetic timing reports, when emitted, include browser scheduling and are not physical paint acknowledgement, low-end performance certification, Lighthouse scores, inclusive user testing or a full WCAG compliance claim. Playwright WebKit is not actual Safari. See `../docs/implementation-status.md` for current executed results; earlier design-test results do not validate this revision automatically.

Official deployment references: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [asset configuration](https://developers.cloudflare.com/workers/static-assets/binding/) and [headers](https://developers.cloudflare.com/workers/static-assets/headers/).
