# Cinematic reference study

Reviewed November 17, 2026 for the Spoilence redesign. The user requested a cinematic, reactive site, without generic generated-page styling, em dashes or purposeless switches. This study supplements `design-research.md`. Only research files were changed by this workstream.

**Latest user direction:** the opening now uses an actual environmental GTA VI screenshot, rather than the earlier Unsplash proposal. The interaction is a mouse-following, pixelated/blurred 16:9 rectangle with irregular small pixel edges. This replaces the earlier circular lens/glass aperture proposal below. See `official-background-review.md` for exact sources, visual selection and attribution. The background is copyrighted Rockstar Games material, not original Spoilence artwork or an open-licensed photograph. Three-tone styling still governs the interface.

## Evidence and inspection limits

Award claims below come from the awarding organization's own project pages. Three published award stills were downloaded and visually inspected. Public live-page content was read for all four sites. Headless visits to Immersive Garden and Lusion reached their loading/introduction states, but did not establish reliable full GPU interaction. Consequently, the interaction descriptions below refer to documented award elements, not a claim that every effect was operated. Stills are compositional evidence, not performance or accessibility certification. Historical award recognition does not imply that today's live revision is identical to the awarded one.

## Four specific award references

### 1. Immersive Garden website

[Awwwards project and evidence](https://www.awwwards.com/sites/immersive-garden-website) records Site of the Day on January 7, 2025, with an overall score of 8.00. The page highlights projects listing and mobile/desktop presentation. [The live studio site](https://immersive-g.com/) organizes its work as immersive brand experiences. Its award still uses a central monogram with detailed flora and a dragonfly in a deep, dark environment. The focal object is unmistakable because it is surrounded by negative space. See `immersive-garden-award-reference.jpg`.

**Transfer to Spoilence:** choose one dominant scene and let the interface sit around it. A protective aperture, veil or shutter should belong to the scene, rather than appearing as a boxed app screenshot next to a generic headline. Give material edges enough light to read against graphite. Preserve a direct download route even when a visitor ignores the scene.

### 2. Hatom

[Awwwards project and evidence](https://www.awwwards.com/sites/hatom) records Site of the Day on November 4, 2024, with an overall score of 7.96. It explicitly highlights a click-and-hold effect, five phases and transitions between phases. Its [live site](https://www.hatom.com/) presents a five-phase loading state. The award still places a single illuminated egg above a continuous landscape, using terrain silhouettes to create near, middle and far depth. The UI is small and stable around the environmental focal point. See `hatom-award-reference.jpg`.

**Transfer to Spoilence:** make concealment feel physical and intentional. A moving reveal boundary can explain the product with one action. Use photographic depth and foreground occlusion before adding particles or shader distortion. Do not import Hatom's loud palette, mandatory loading, recommended audio, or a hold-only action. The award page itself rates animation/transitions 9.40 and accessibility 6.60 in the developer breakdown; impressive animation is not evidence that a flow is sufficiently accessible.

### 3. 100 Lost Species

[Awwwards project and evidence](https://www.awwwards.com/sites/100-lost-species) records Site of the Day on October 20, 2025, with an overall score of 7.56. It identifies a memorial unfolding over 100 seconds and highlights introduction, content and time-related features. [The live site](https://www.100lostspecies.com/) is script-heavy in text browsing. The inspected award still combines an airy gallery, carefully framed wildlife imagery and a small number of navigation/filter controls. Its environment supplies texture around a quiet content surface. See `lost-species-award-reference.jpg`.

**Transfer to Spoilence:** derive the pacing and hierarchy from the subject. The first encounter with a story is irreversible, so discovery should be deliberate. Let imagery and concise typography carry that idea. A single editorial transition from the coastal scene to a clear product demonstration is more meaningful than independently animating every card. Do not copy its countdown or make visitors wait to download.

### 4. Lusion

[Awwwards project and evidence](https://www.awwwards.com/sites/lusion) records the historical Lusion site as Site of the Day on May 20, 2019, scoring 7.96. The entry explicitly highlights WebGL scroll navigation and an interactive figure click, and lists a black/white palette. [The current Lusion studio site](https://lusion.co/) states its focus on 3D visual storytelling and interactive experiences. The current live revision is not asserted to be the 2019 award revision.

**Transfer to Spoilence:** an interaction should express a recognizable idea, rather than decorate a component. The strong opening should make visitors understand preservation and revelation. Keep the title, download and motion explanation legible without requiring the effect to load. A graphic shutter or masked image can express that idea without rebuilding Lusion's full 3D runtime.

## Best-fit photographic material

### Recommended: Miami Beach at dusk, Jairo Gonzalez

[Original Unsplash page](https://unsplash.com/es/fotos/vista-aerea-del-skyline-de-una-ciudad-costera-al-anochecer-hB2R47qB8yA). Its structured metadata identifies **Jairo Gonzalez** as creator, author and credit, with Miami Beach, South Beach as the location. The page marks the photograph free under the [Unsplash License](https://unsplash.com/license), rather than Unsplash+. The license permits downloading and using images for commercial or non-commercial work; its restrictions include selling unmodified images and compiling a competing image service. No assertion about all possible third-party property rights is needed for this design study.

The inspected photograph has a peach sky occupying roughly the upper third, an ocean/shoreline diagonal at left, city detail at right, and atmospheric distance toward the horizon. It already contains the desired warm light, so less visual processing is needed than in the daytime alternative. Distant beachgoers are small; there are no close-up people or game/story assets. This is a real city photograph and must not be labeled GTA VI gameplay or official artwork.

- Image source: `https://images.unsplash.com/photo-1774238357104-dbe2b5ad0209`
- Inspection copy: `miami-dusk-study.jpg`, requested at 1600px wide, JPEG, quality 80.
- Full source dimensions reported in page metadata: 8064 x 6048.
- Suggested credit: Photo by Jairo Gonzalez on Unsplash, linked to the original page.

### Alternate: Miami Beach daytime, Mazin Omron

[Original Unsplash page](https://unsplash.com/photos/aerial-view-of-miami-beach-cityscape-on-a-sunny-day-pScE_HL9JBM) identifies **Mazin Omron** and marks the image as a free photograph. The ocean at left and strong avenue perspective through the middle create depth, but the saturated blue daylight would need more grading for the three-tone direction. Inspection copy: `miami-day-study.jpg`; source image ID `photo-1754269675202-6fb0016d9f21`.

## Proposed cinematic grammar

The working concept is a first-view scene seen through an opening shutter. An uninterrupted coastal photograph takes the width; white Inter display type sits across a carefully darkened, stable zone. Graphite becomes the physical protective material, peach the edge light and call to action. The image is a stage, not a wallpaper behind a generic rounded panel. An 8px edge language and generous 8px-based spacing keep continuity with `DesignLanguage.md`.

One cue leads the page: the visitor can move or intentionally reveal the opening. Mouse movement should shift only a few layers by a small amount, with a steady horizon. A keyboard-operable button and touch interaction provide the same meaningful outcome. Downloads, browser selection and setup instructions never move or depend on this interaction. Native scrolling remains native. No sound, artificial loading gate, bespoke cursor, fake live counter or ornamental switch is justified.

The title can enter through one short, finite mask reveal, like a film credit coming into view. It must settle quickly and render fully when motion is reduced. Use scroll progress for a subsequent rules story only when the progression explains what the shield does: exposed content, local decision, concealed item, deliberate reveal. An unobtrusive progress indication may follow those meaningful states; it should not introduce a second set of fictional chapters or hide essential content pending scroll.

The lower page should read as an editorial sequence: the reason to preserve surprise, a clear concealment demo, a concise privacy statement, then setup. Remove repeated chapter labels that add no navigation information. Use larger body copy, controlled line lengths and fewer but stronger moments of contrast. Text does not need to fly around the viewport for a page to feel cinematic.

## Motion and usability constraints

- Preserve the user's white/graphite/peach palette. A photograph can be toned and darkened; it should not introduce a competing UI accent color.
- Keep the hero's information complete when JavaScript or advanced effects fail. No essential copy should remain clipped waiting for an animation.
- Offer reduced motion through the operating-system preference and a truthful control only if there is persistent motion worth pausing. Do not add switches that merely change a label.
- Prefer response to input over a perpetual render loop. Limit displacement and pause decorative work outside the viewport or while hidden.
- Make every displayed control have a visible, testable result. A reveal action should change a real mask state; a mode control should change the demonstration; browser selection should change setup.
- Test keyboard focus, 320px layouts, contrast over the actual graded photo, focus visibility, real downloads and touch release behavior. Award recognition is inspiration, not a substitute for these checks.

Award-site screenshots and the unused Unsplash photographs in `research/` are study material. No award reference site's graphics or code should be deployed. The user's subsequent, explicit choice to use actual GTA VI imagery is documented separately in `official-background-review.md`, including Rockstar attribution and its copyright distinction.
