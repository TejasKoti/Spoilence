# Experimental gaming rebuild: historical study

**Superseded:** this document records earlier experiments and is not the current implementation specification. The user subsequently selected the exact [Christen Dijoux portfolio reference](https://www.awwwards.com/sites/christen-dijoux-portfolio). The current website uses a framed monochrome editorial composition, tall outlined-line typography, an original large SPOILENCE wordmark and a reactive Canvas 2D dithered sculpture in normal document flow. The earlier sticky film-frame sequence, scene selectors, motion switch, censorbox and water/refraction treatments are removed. See [current reference notes](christen-dijoux-reference.md) and [website operation](../README.md).

The sections below preserve the earlier design proposal, interaction contract and planned verification for historical context. Their descriptions of controls, scene selection, typography and effects must not be read as claims about the current runtime or current passing tests.

## Design

Official GTA VI environments fill the opening shot. Oversized Barlow Condensed gives the headline a poster-like identity, while Inter keeps body copy and controls readable. White, graphite and peach remain the interface palette. The artwork retains its game colors. Foreground text and frame layers respond gently in opposition to a bounded camera pan, adding depth without obscuring the scene. Buttons stay stationary.

Vice City and Leonida Keys are actual image choices. There is no automatic carousel, artificial loading sequence, fake diagnostic readout or decorative switch. The title entrance and location transitions are finite. The lower page becomes quieter: a functional concealment demonstration, privacy facts, practical setup steps, questions and a peach closing panel.

## Interaction contract

- Mouse movement pans the photograph within a small safe margin and shifts the title/frame a few pixels in the opposite direction.
- Arrow keys provide the same camera control, and Home returns to neutral. Touch places the camera without blocking scrolling.
- Pause motion resets the layers and stops decorative work. Reduced-motion preferences take precedence.
- Location changes update the real image, pressed state and live status. Rapid selection cancels any earlier transition.
- No cursor block, pixel canvas, image sampling, screen capture, video analysis, sound, pointer logging or idle render loop remains.
- Hide, Blur, Reveal and Conceal affect the fictional product demo. The download and installation controls retain real outcomes.
- Website text and titles contain no em dashes.

## Research

[Lando Norris](https://www.awwwards.com/sites/lando-norris) informed the focused interactive stage and meaningful world choices. [Siena Film Foundation](https://www.awwwards.com/sites/siena-film-foundation) informed the typographic and cinematic framing. [Immersive Garden](https://www.awwwards.com/sites/immersive-garden-website), [Hatom](https://www.awwwards.com/sites/hatom) and [Lusion](https://www.awwwards.com/sites/lusion) informed the broader composition and motion review. The primary award evidence, reference stills and rendering limits are documented in cinematic-references.md. No claim that Spoilence has won these awards is made.

The backgrounds are environmental screenshots from [Rockstar's official GTA VI gallery](https://www.rockstargames.com/VI/media/screenshots), included at the user's explicit request. Copyright remains with Rockstar Games. They are not claimed as original artwork or openly licensed. See public/assets/artwork-source.txt for exact sources. Research-only photographs and older studies are outside the deployed asset root.

## Verification

Automated tests use an isolated server on 8791. They verify visible layer movement, keyboard/touch equivalents, actual scene selection, real transition cancellation, no idle callbacks, no em dashes, no cursor overlays/canvases, responsive layout, downloads, browser routing, accessibility scans and true 404s. Synthetic pointer timing is a scheduling measurement, not physical paint acknowledgement or low-end device certification. Publication is left to the user.
