# Official GTA VI background review

Reviewed November 17, 2026. This records the user's newer request for **actual GTA VI background imagery** and a **mouse-following 16:9 pixelated/blurred patch with irregular small pixel edges**. It supersedes the earlier original-SVG and Unsplash hero-image proposals. No image generation was used. This workstream saved references only; implementation copies and effects are handled by the main website workstream.

## Primary source

[Rockstar Games' official GTA VI screenshot gallery](https://www.rockstargames.com/VI/media/screenshots). Four directly served JPEGs were downloaded at 1920px width and visually inspected. Each was 1920 x 1080, matching the requested 16:9 image geometry. These are promotional game screenshots from Rockstar, not photographs of real-world Miami.

| Official image | Study file | Visual assessment |
| --- | --- | --- |
| Vice City 03 | `vice-city-03-official-study.jpg` | Recommended. Sunlit city, palms, streets, waterfront and distant skyline. No prominent story character or plot event apparent in the frame. Rich detail makes the moving pixelation legible. |
| Leonida Keys 01 | `leonida-keys-01-official-study.jpg` | Strong alternate. Coastal islands, bridge, sea and a seaplane in the lower-right. More quiet sky/water and a broad horizon. |
| Vice City 02 | `vice-city-02-official-study.jpg` | Balcony view with two foreground characters. Attractive lighting, but foreground people dominate and distract from the environmental brief. |
| Vice City 04 | `vice-city-04-official-study.jpg` | Close-up of two characters. Poor fit for this background and the user's cinematic landscape direction. |

This is a visual assessment of the supplied frames, not a guarantee that every visitor considers environmental promotional imagery spoiler-free. No specific plot events are identified or described.

## Exact asset sources

- [Vice City 03, recommended](https://www.rockstargames.com/VI/_next/static/media/Vice_City_03.0nqz~lrqdmlze.jpg?akim=1&imdensity=1&imwidth=1920)
- [Leonida Keys 01, alternate](https://www.rockstargames.com/VI/_next/static/media/Leonida_Keys_01.0zgz7tveur6y8.jpg?akim=1&imdensity=1&imwidth=1920)
- [Vice City 02](https://www.rockstargames.com/VI/_next/static/media/Vice_City_02.0c5.7qx17u9kl.jpg?akim=1&imdensity=1&imwidth=1920)
- [Vice City 04](https://www.rockstargames.com/VI/_next/static/media/Vice_City_04.06evqutgh7624.jpg?akim=1&imdensity=1&imwidth=1920)

Downloaded JPEG byte lengths: Vice City 03 **440,266**; Leonida Keys 01 **297,322**; Vice City 02 **216,007**; Vice City 04 **261,520**. Source hashes are recorded in `official-background-provenance.json`.

## Attribution and truthful product language

Suggested visible credit: **GTA VI screenshot © Rockstar Games. Spoilence is an independent project and is not affiliated with Rockstar Games.** Link the credit to the official gallery. Preserve the project's existing trademark/independence disclosure.

This review does not establish an open-source or stock-photo license for Rockstar imagery. The user's instruction authorizes choosing and implementing the asset for this project, but does not turn it into original Spoilence artwork or establish Rockstar endorsement. The earlier Unsplash license and Jairo Gonzalez credit do not apply to this GTA VI screenshot. Do not ship both attribution systems for the same background.

## Interaction fit

Keep the image continuous and recognizable. The effect should blur/pixelate the same portion of the scene directly under the pointer, rather than reveal a different crop or an unrelated image. Use a rectangle whose width-to-height stays 16:9; a circle or a decorative orbit would contradict the newer request.

Small irregular rectangular pixels at the border can supply a controlled digital breakup. Their positions should remain attached to the patch, with bounded changes, rather than turning into a continuous particle field. Maintain a coherent central concealed area so the interaction communicates spoiler protection. The patch must not obscure the heading, navigation or download controls; those should stay in a stable foreground layer.

For keyboard and touch, the result should remain meaningful and comparable to pointer input. Preserve the tapped location on touch release. Reduced-motion users should receive a stable alternative, and natural scrolling should remain available. No new random switches are needed. Any control displayed must perform a visible, testable action.

Use a local copy in the public asset root to avoid runtime requests to Rockstar. Apply the three-tone design system to interface elements, overlays and typography while retaining enough of the actual screenshot's detail for the requested background to read clearly. No plot copy, audio, video playback or analysis is required.
