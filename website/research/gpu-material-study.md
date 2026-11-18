# Reactive GPU material study

Reviewed November 17, 2026 for the user's latest request: stronger visual depth and a memorable reaction, with **no Vice City/Leonida Keys selector and no Pause motion control**. The default official Vice City texture remains. The current direction is a continuous photographic material, not another cursor censor, circle or UI widget. No runtime implementation was changed by this research workstream.

## Three implementation references

### 1. Velocity-fed flow distortion

[Codrops: Mouse Flowmap Deformation with OGL](https://tympanus.net/codrops/2019/09/25/mouse-flowmap-deformation-with-ogl/) explains writing pointer velocity into a low-resolution flow texture and using its direction to offset photographic UV coordinates. Primary implementation is available in [Robin Delaporte's demo repository](https://github.com/robin-dela/flowmap-effect) and [OGL's Flowmap source](https://github.com/oframe/ogl/blob/master/src/extras/Flowmap.js). The current source defaults to a 128px render target, falloff, dissipation and half-float storage.

**Why it fits:** quick pointer movements leave a short-lived wake, while slow movement makes a broad, gentle deflection. The texture responds to gesture speed instead of merely following a point. This can make the same GTA screenshot feel like a tangible optical membrane.

**Tradeoff:** a real flowmap needs off-screen ping-pong targets and additional draws. Float-target compatibility must be checked rather than assumed. A small fixed set of analytical impulses is a simpler alternative if benchmarking or browser support makes simulation unjustified. The principle can be adapted without importing all of OGL.

The newer [2026 Codrops portfolio case study](https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/) describes flowmap deformation coupled to pointer velocity and directional chromatic sampling. It confirms this is an actively used interaction technique, but its rainbow chromatic treatment is unsuitable for Spoilence's three-tone interface. Borrow the physical response, not the rainbow.

### 2. Scroll-speed deformation of the actual image surface

[Codrops: Distortion and Grain Effects on Scroll](https://tympanus.net/codrops/2024/07/18/how-to-create-distortion-and-grain-effects-on-scroll-with-shaders-in-three-js/) shows vertex deformation driven by scroll velocity, using a sine envelope across an image plane. The [published demo](https://tympanus.net/Tutorials/ShaderOnScroll/) supplies a direct reference. Its fragment stage also shows how an interaction can modulate UV distortion without permanently changing the source image.

**Why it fits:** a shallow plane bow or a brief edge curl during native scrolling gives the photograph volume. It should return to a stable surface when scrolling stops. This is more substantial than moving a flat background a few pixels.

**Tradeoff:** a genuine silhouette change needs subdivided geometry, not just a fragment shader on a four-vertex quad. Keep subdivisions bounded, retain enough overscan to avoid exposed image edges, and avoid bending identifiable buildings so far that the scene looks like a novelty filter. Scroll should provide a normalized input signal, never become a hijacked camera controller.

### 3. Progressive enhancement with a readable DOM underneath

[14islands: Progressively Enhanced WebGL Lens Refraction](https://tympanus.net/codrops/2023/10/10/progressively-enhanced-webgl-lens-refraction/) aligns GPU planes to existing DOM images. The [live tutorial](https://tympanus.net/Tutorials/WebGLLensRefraction/) explains the mixed HTML/WebGL model and the [official scroll-rig repository](https://github.com/14islands/r3f-scroll-rig) documents the approach.

**Why it fits:** the official image can remain in the document as a fallback, while an aligned canvas supplies the material reaction. Typography, download links and browser controls stay in HTML, stable and accessible. A failed shader must never turn the opening into a blank screen.

**Tradeoff:** full scene refraction can require rendering text and images into GPU space. That is unnecessary here. Do not adopt its React/Three/scroll framework merely to animate one photograph. Borrow DOM alignment and progressive enhancement; keep the navigation, heading and ordinary browser scrolling native.

## Recommended cohesive effect

One photographic surface, three related responses:

1. **Slow pointer:** a broad, restrained optical bend with a moving highlight. The response should feel attached to the photo's surface, not a detached colored glow.
2. **Fast pointer:** an elastic, dissipating wake governed by gesture velocity. Use short-lived impulses rather than a perpetual noise field. Modulate warmth/brightness gently; avoid neon RGB splitting.
3. **Native scroll:** a shallow perspective bow or edge curl that settles quickly, introducing the next section as the scenic plane exits.

This is a material vocabulary, not three unrelated special effects. No cursor replacement, scene-selection buttons, fake status metrics, mouse censorship box, autoplay sound or new toggle is needed. The user's requested default image remains recognizable. No audio/video analysis, depth inference, external inference or runtime asset fetch beyond the local static texture is involved.

## Feasibility and test criteria

- Keep all readable interface content outside the canvas. The effect must not move hit targets or distort the title.
- Start with one texture and one bounded mesh. Cap device pixel ratio and render-buffer dimensions independently of the display's native density. Measure fill cost before adding off-screen simulation passes.
- Keep the still image visible until shader compilation, texture upload and the first successful frame. Context failure/loss restores the still image.
- Do not introduce a continuous idle animation. Run frames only while pointer/scroll energy is present, then stop when settled. This allows removing the Pause motion control without leaving unavoidable ambient motion running.
- Honor `prefers-reduced-motion` automatically. Hidden or offscreen sections should schedule no decorative work. Context cleanup must release textures, buffers and programs.
- Test slow movement, fast direction changes, pointer exit, native scrolling, touch, OS reduced-motion changes, context loss, viewport resize and long idle periods. Record actual frame timing rather than claiming a guaranteed frame rate from a visual screenshot.

## Inspection boundary

The technique descriptions were read in indexed primary Codrops material and verified against accessible author/library source repositories and published demos. Direct article fetching returned HTTP 403 in this environment. No claim is made that the GPU demos were physically operated or benchmarked here. These references justify an implementation experiment, not a promise of measured performance or award-equivalent production quality.
