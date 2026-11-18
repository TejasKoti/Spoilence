# Christen Dijoux reference study

Reviewed November 17, 2026. The user supplied this exact reference and requested its style. It supersedes the earlier liquid-photo, depth-map and scroll-warp proposals. This study records observed design features and a self-authored Spoilence adaptation, not copied portfolio code or graphics.

## Exact sources and award status

- [User-supplied Awwwards page](https://www.awwwards.com/sites/christen-dijoux-portfolio)
- [Actual portfolio](https://christendijoux.com/)
- [Creator's Lab](https://christendijoux.com/lab)
- [Creator's public site summary](https://christendijoux.com/llms.txt)

The Awwwards page fetched successfully through a normal HTTP request and identifies the entry as **Nominee, October 28, 2026**. It does not currently establish Site of the Day or another winner title. The page describes monochrome composition, a dithered WebGL sphere, kinetic type, a cursor lens and a component Lab. It highlights a pinned project gallery, a numbered editorial menu and journey globe. Do not call this particular reference an award winner merely because it is hosted on Awwwards.

The live HTML, stylesheet and script assets were reachable. An initial headless browser visit remained at the `060` loading/SSR shell. A later Chromium visit on November 17 successfully initialized the real page and its canvases. Computed 16px heading sizes from the earlier incomplete shell are not the intended design. Composition was first verified by viewing three original images served by Awwwards:

- `christen-awwwards-reference.jpg`: full first-screen submission image, 1600 x 1200.
- `christen-hero-awwwards-reference.jpg`: published hero element still.
- `christen-hero-second-reference.jpg`: published journey/globe element still.

These are research references only and belong outside the deployed public asset root. The two attempted live captures, `christen-home-reference.jpg` and `christen-scroll-reference.jpg`, show the incomplete loading shell and must not be presented as the finished reference experience.

## Verified visual language

**Palette.** The live CSS uses near-black `#050505` and warm white `#F2F2EE`, with numerous opacity mixtures rather than colorful gradients. The result is monochrome, high contrast and textural. A quiet GTA screenshot may remain behind Spoilence's scene where required, but the interface should read primarily through dark/white contrast. Peach should be used only as a restrained existing brand accent, if retained.

**Frame and navigation.** The first-screen still has a fine border inset close to the viewport edge. A compact horizontal navigation bar is symmetrical around a centered boxed monogram. Small numbered links sit in two balanced groups. The top bar is stable and narrow, with technical typography, then a horizontal metadata band. The hero feels like one editorial surface, not a floating rounded card.

**Type hierarchy.** The live font imports and CSS identify **Big Shoulders Display** for narrow display lettering, **Geist** for body type and **Geist Mono** for technical text. The left hero statement has unusually tall, condensed uppercase lines; a middle line is outlined. The enormous wide bottom signature is a separate graphic treatment, not simply the narrow display font enlarged. Small body text remains readable in a compact right-side pitch panel. The signature, display phrase and metadata have deliberately different jobs.

**Composition.** A large dithered, organic spherical form occupies most of the center/right hero. There is generous dark negative space around the left display phrase. The pitch and two actions sit in a sharp rectangular bottom-right panel. The large bottom signature spans almost the viewport width and anchors the page. The first-screen image is approximately organized as: navigation in its top 5%, metadata around the next 10%, the reactive mass behind the main middle area, left display statement in the lower-middle, pitch panel opposite, and signature across the bottom 15%.

**Texture.** The visual form is constructed from a deliberate dot/pixel pattern. Bright and dark marks vary in density, giving the impression of volume and surface folds. A faint background grid/dot field supports it. This is not a blurred photographic cursor box or a luminous ring floating above a flat image.

**Motion evidence.** The Awwwards elements document a dithered hero with cursor lens, kinetic signature/type, a journey globe and a pinned/shared-image project transition. The later live visit confirmed that both the background dot field and the dense organic form share one full-stage reactive scene. Details and limits of that visit follow. No frame-rate or GPU-cost measurement was performed.

## Later live interaction inspection

The real portfolio loaded in headless Chromium on November 17, 2026. At a 1440px desktop viewport, its document contained **14 canvas elements**. The hero canvas measured **1440 x 936 CSS pixels**, positioned at **x 0, y 65**, and filled its absolutely positioned hero parent. It is a full-stage renderer, not an isolated small sphere canvas over a separate inert grid. Other canvas elements belonged to later page effects, so the count does not imply 14 continuously active hero renderers.

Saved evidence, kept in this research directory:

- [Pointer over the dense form](christen-live-pointer-core.jpg): pointer moved to approximately `(1030, 400)`, then captured after 700ms.
- [Pointer over the empty background](christen-live-pointer-background.jpg): pointer moved to approximately `(170, 430)`, then captured after 700ms.
- `christen-live-neutral.jpg` was captured before the opening transition had finished. It is an incomplete loading view and should not be used as the reference appearance.

**What is visibly reactive.** A low-contrast regular dot lattice covers the empty background. A much brighter and denser dither pattern describes the large organic form on the right. Moving the pointer onto the otherwise empty left field places a small thin ring around a tiny central square and produces a local lens-like change in the dots. Moving over the right form changes its apparent illumination, surface detail and deformation. The form also evolves with time, so a difference between the two screenshots is not proof that the pointer alone caused every change. The cookies panel remained open and partly obscured the lower-left title; it was not dismissed.

**Full-stage principle and earlier shield interpretation.** The live reference establishes a useful full-stage principle: make the entire decorative background react, including its sparse dots, using one coherent coordinate system. A separate idle texture behind a small moving emblem misses that spatial effect. An earlier Spoilence request called for a recognizable shield silhouette with shoulders, narrowing sides and a pointed lower tip. That shield interpretation is now superseded by the user's circular-mound request below. Readable type and working product actions remain stable.

**What remains unverified.** The rendered visit did not establish the creator's shader implementation, exact animation equations, frame rate or low-end performance. A subsequent ordinary navigation to the Lab returned an HTTP 429 security rate-limit response. Further requests to that host were stopped. No live Lab explanation of a component named `DitherHero` was obtained, and no third-party source code was copied into Spoilence. The current source-level technique remains the creator's implementation, not an inferred recipe.

## Spoilence adaptation

**Latest user override:** the current centerpiece is a circular download/pitch card above a larger circular raised mound. A brand-orange `#FDBA74` ring resonates outward beyond the card every five seconds over a 1.6-second burst. The shader measures the actual card position and size on resize, keeping both centers aligned while pointer movement affects light and bending. The real card links remain usable, and the card joins normal document flow on smaller screens. The separate shield emblem and entire metadata strip were explicitly removed. The earlier shield guidance above records a superseded request. The portfolio's full-stage reactive lattice, monochrome texture and editorial type remain useful reference principles.

1. **One bordered editorial canvas.** Replace the earlier cinematic poster/HUD with a nearly black, finely framed opening. Put the Spoilence identity and useful section links around a centered own-brand mark. Number links only when they identify real sections.
2. **Tall product statement.** Use a concise, self-written three-line statement about preserving discovery. Big Shoulders Display supplies the tall narrow rhythm; outline the meaningful middle line. Do not reproduce the creator's personal headline or biography.
3. **Original full-stage field and circular mound.** Author one coherent reactive background with a sparse dot lattice and a dense circular raised surface. The latest requested periodic ring should visibly travel outward, with finite rendering bursts and quiet gaps between them. Pointer interaction may bend and light the field, while reduced motion leaves a static mound. Use a matching static fallback. Describe the actual renderer truthfully, and keep the required official GTA asset local and attributed if used as a backdrop or texture.
4. **Own signature across the bottom.** Create a large custom SPOILENCE wordmark treatment that responds in the site's own language. Do not trace the creator's CHRISTEN signature or monogram. The brand wordmark must remain recognizable and legible.
5. **Functional circular pitch card.** Use concise product copy and actual download/demo actions inside the requested circular card, with the mound and orange resonance centered beneath it. Keep the card stable while the artwork reacts. A portfolio's collaboration flag, clock, geography and resume controls do not belong in Spoilence unless there is a real product reason for them.
6. **Carry the system below the fold.** Apply the same condensed section headings, monospace indices, thin dividers and quiet surfaces to the existing demo, privacy and browser setup. The reference should inform the whole site, not just add a new hero above unchanged card styling.

The removed scene selector and Pause motion buttons should stay removed. OS reduced-motion and a static fallback are implementation behavior, not extra decorative switches. Do not add the reference's hidden games, chatbot, location globe, language toggles or fake status fields simply to resemble its feature list.

## Font asset supplied for this adaptation

Downloaded the official Google Fonts Latin variable WOFF2 for **Big Shoulders Display**, normal style, weights 100 through 900:

- Runtime file: `public/assets/fonts/BigShouldersDisplayVariable.woff2`, **35,436 bytes**.
- License: `public/assets/fonts/BigShouldersDisplay-LICENSE.txt`, **4,396 bytes**, SIL Open Font License 1.1.
- [Official CSS source](https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@100..900&display=swap)
- [Official font binary](https://fonts.gstatic.com/s/bigshouldersdisplay/v24/fC1_PZJEZG-e9gHhdI4-NBbfd2ys3SjJCx1czNDu.woff2)
- [Google Fonts upstream license](https://github.com/google/fonts/blob/main/ofl/bigshouldersdisplay/OFL.txt)
- SHA-256 and source metadata: `big-shoulders-font-provenance.json`.

The WOFF2 signature was verified. The existing self-hosted Inter body face and monospace face can remain as practical Spoilence equivalents; no Geist download is needed. The final page should make no runtime request to Google Fonts.

## Implementation checks implied by the reference

- Every word in the narrow headline remains visible at 320px; outline text has enough stroke contrast.
- The bottom wordmark does not create horizontal overflow or cover the download panel.
- The scene remains decorative or has an accurate accessible description. It cannot absorb clicks intended for real controls.
- Reduced motion, blocked canvas and initialization failure all leave complete copy and working download links.
- Pointer reactions should settle. The requested five-second resonance should render only during its finite active burst, using a timer during the quiet gap. Reduced motion, a hidden document and an offscreen scene should stop both animation frames and periodic timers.
- No full-screen loader is needed. The attempted reference visit demonstrates why importing its loading friction would be unhelpful for a small download site.
