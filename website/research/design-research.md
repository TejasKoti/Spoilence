# Spoilence: visual research and design direction

Researched 2026-11-17. Brief: a deployable website for the browser-only Spoilence project; futuristic, three-tone aesthetics; pointer-reactive; follow ../DesignLanguage.md. This is a researched design interpretation, not a reproduction of any reference site. No attached source HTML was supplied with DesignLanguage.md, so its written tokens and composition guidance govern the work.

**Scope note for the later cinematic revision:** the current user request overrides this first design's original-art-only decision. It now calls for an actual GTA VI environmental background, with a moving 16:9 blurred/pixelated rectangle and irregular glitch-like pixel edges. That official screenshot is Rockstar Games artwork and must not be described as original Spoilence artwork. The original shield drawing and Unsplash alternatives are earlier design studies. Current image research and attribution are in `official-background-review.md`; award-winning-site comparisons are in `cinematic-references.md`.

## The visual system

Three color families: **white #FFFFFF**, **graphite #11151D**, **peach #FDBA74**. Their translucent mixtures supply depth without adding a fourth hue. Graphite text on white, white text on graphite, and graphite text on peach form the main readable combinations. Peach is not body text on white. Inter supplies 500-weight display typography and 400-weight body text; JetBrains Mono is reserved for small technical facts. Fonts are self-hosted with swap fallbacks. Base spacing is 8px, primary gaps 16px, controls/cards 8px radius, and section rhythm approximately 80px. These decisions come directly from the user's DesignLanguage.md.

The first viewport is a cinematic split composition: a large, left-aligned promise and clear download action alongside a tangible protective lens over a coastal scene. A graphite stage concentrates visual drama; the surrounding page stays white. The lower page opens into a working concealment demo, a readable privacy explanation, browser-specific installation, and compact questions. This avoids a repeated generic feature-card grid. The hero is the one deliberately expressive object; form controls remain stable.

```text
Spoilence        How it works / Privacy / Install       Download

Go in unspoiled.                [coastal shield lens]
Local GTA VI spoiler shield.    [mouse-reactive stage]
[Download] [Try the demo]       [Motion on/off]

Chrome / Edge / Brave / Opera GX / Firefox / Safari

[functional Hide / Blur demo]   Your feed. Your choice.
Private by design              concise data lifecycle
Choose browser / download / load folder / reload
Questions                       footer + independent-project note
```

## Rockstar and GTA VI graphics research

- [Official GTA VI site](https://www.rockstargames.com/VI): cinematic scale, place-led presentation, strong separation of navigation and artwork. Borrow the focus and controlled visual density; keep Spoilence's download journey readable. No game release date or plot information is needed on this site.
- [Official screenshots](https://www.rockstargames.com/VI/media/screenshots): visually inspected Vice City 01 and 13, Leonida Keys 01 and 07. The coastal view uses distant atmospheric layers and a clear near/middle/far hierarchy; the city sign scene uses warm edge light against dark silhouettes; the club uses bright focal lighting; the underwater image frames a lit center with dark foregrounds. These are observations of artwork, not assertions about game engine features or final runtime fidelity.
- [Official launch gallery](https://www.rockstargames.com/VI/launch-gallery): large imagery and a controlled exploration sequence. Adapt this as one original coastal illustration rather than making users navigate a gallery before finding the download.

The original hero uses palms, an ocean horizon, atmospheric peach light, and a protective optical form. It includes no Rockstar logos, screenshots, characters, maps or story scenes. Research JPEGs are retained in website/research only and are excluded from the deployed public directory. The three-tone constraint deliberately replaces the reference imagery's many neon colors.

## Reactive-page examples and fit

| Reference                                                                                                                                                 | What it demonstrates                             | Fit for Spoilence                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [React Bits Spotlight Card](https://reactbits.dev/components/spotlight-card)                                                                              | Pointer-local illumination                       | Good: local light on the shield's stage gives immediate feedback. Avoid repeating it on every section.                                                                                             |
| [React Bits Tilted Card](https://reactbits.dev/components/tilted-card)                                                                                    | Cursor-facing depth and layered highlights       | Good in moderation: limit tilt to a few degrees and keep all controls outside the moving layer.                                                                                                    |
| [Codrops Pixel Distortion demo](https://tympanus.net/Development/DistortedPixels/)                                                                        | A pointer changes image presentation             | Good conceptual fit for conceal/reveal, but a full GPU distortion pipeline is unnecessary here.                                                                                                    |
| [Codrops shader reveal article](https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/) | Pointer-centered image masking and reveal        | Adopt the mask concept using native CSS clipping. Search content was accessible; direct article fetch returned 403, so no claim of live-demo interaction is made.                                  |
| [Bruno Simon](https://bruno-simon.com/)                                                                                                                   | A site whose interaction expresses its subject   | Useful principle: make the interaction explain protection. The site describes Three.js/WebGPU and a navigable 3D world; that level of runtime machinery would outweigh this download site's needs. |
| [Mainak Banerjee tilt/spotlight study](https://themainakb.com/labs/tilt-card-spotlight)                                                                   | One pointer signal coordinates tilt and lighting | Use one bounded pointer calculation for lens, tilt and light. The author identifies this as an experiment; it is a reference, not a production dependency.                                         |

These examples were reviewed through their public documentation/source descriptions; this is not a comparative performance benchmark or a claim to have physically operated every live demo. No third-party component implementation is copied into the runtime.

**Chosen interaction: shield lens.** Mouse movement shifts a circular illuminated viewport over harmless original coastal artwork while the stage subtly tilts. Arrow keys move the same lens; a tap places it on touch screens without blocking scrolling. Leaving the stage recenters it. A persistent page control pauses pointer motion, and prefers-reduced-motion disables it automatically. No cursor replacement, camera, sensor, sound, pointer history, analytics or network effect is involved. Work is scheduled only on input with a single pending requestAnimationFrame; there is no idle render loop. The separate product demo requires an intentional button press to reveal fictional content. Hover never reveals real spoilers.

## UX, accessibility and performance evidence

- [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): verify 4.5:1 for normal text and 3:1 for large text. Measure actual palette pairs in tests. Do not make a full WCAG conformance claim from contrast checks alone.
- [W3C target sizes](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): use generous 44px primary controls, exceeding the basic 24px minimum. Native buttons/links/selects, visible focus and a skip link support keyboard use.
- [W3C interaction motion](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html): disable nonessential motion for reduced-motion preferences and expose a manual control. Avoid scroll hijacking and moving text.
- [Google animation guidance](https://web.dev/articles/animations-guide): keep the depth response to transform/opacity; the small lens clip is paint work and must be measured separately. No fullscreen continuously animated blur or WebGL dependency.
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame): use a one-shot frame per input burst. Cancel work when hidden/paused and do not schedule a self-perpetuating loop.
- [NN/g aesthetic-usability effect](https://www.nngroup.com/articles/aesthetic-usability-effect/): visual appeal can conceal usability issues. Validate downloads, browser instructions, keyboard paths and disclosure rather than treating attractive screenshots as proof of usability.
- [Vercel interface guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): native semantics, form labels, focus, responsive overflow, reduced motion and intentional transitions informed the implementation review.
- [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/) and [headers](https://developers.cloudflare.com/workers/static-assets/headers/): publish public/ only via Wrangler, keep source/research outside assets, use a restrictive CSP and a custom 404. No application server is needed. Deployment is left to the user.

## Review before implementation

The initial generic glass-card idea was rejected: it would repeat decorative boxes and hide the product's purpose. The revised design places the entire expressive treatment in the shield lens and makes everything below a clear download/setup path. No WebGL is required because the effect is a single 2D scene with shallow depth. Device identity is used only to suggest instructions, with an explicit selector because some browsers hide their names. Compatibility candidates remain distinct from validated browsers. No store approval, universal browser support or perfect spoiler detection is advertised.
