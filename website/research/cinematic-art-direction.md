# Cinematic revision: art direction

The previous site treated the artwork as a boxed feature beside a headline. This revision treats the first viewport as an opening shot. DesignLanguage.md remains the token source; the three color families remain white, graphite #11151D and peach #FDBA74. The lower page stays light and readable.

## Composition and typography

Use a licensed, real Miami photograph with a restrained warm monochrome grade. A large Inter 500 headline sits in its own stable foreground plane; the scene can move without dragging text or buttons around. The city establishes the GTA VI context without characters, game screenshots, spoilers, fake HUDs or glowing generic shields. Body copy is 16px where it explains the product and installation. Small type is reserved for supplementary facts.

```text
light wordmark / minimal navigation over the opening shot

              THE FULL-WIDTH COASTAL FRAME
  Go in
  unspoiled.                     [sharp glass aperture]
  local spoiler shield           [pointer / keyboard / touch]
  Download / See how it works

  scroll to explore                           Pause motion

white page / short statement / functional concealment demo
dark privacy interlude / actual data practices
white installation / readable task steps / honest compatibility
FAQ / closing download / credits
```

## Motion contract

One finite masked title entrance provides the opening beat. Pointer input shifts a bounded glass aperture and modest scene parallax. Scroll changes the aperture's framing using native scroll position, with one pending animation frame per input burst. No smooth-scroll library, scroll interception, forced loader, audio, autoplay video, continuous particle loop or cursor replacement. Readability and download access do not depend on motion finishing.

Pause motion is a plainly labeled action that actually freezes and resets all decorative movement; Resume motion restores it. The OS reduced-motion preference takes precedence. Text and controls remain static while the photograph shifts. Touch placement stays where tapped; arrow keys and Home provide the equivalent operation. Native buttons, links, select and details remain the interaction model.

No em dashes in website copy. No decorative switches. Hide and Blur buttons change the real demo; Reveal and Conceal restore its accessibility state; Copy copies the address or selects it with a recovery instruction. The download is the current browser-only ZIP.

## Critique before implementation

A full-screen WebGL scene would add machinery without helping someone understand or download a small local extension. A flat vector shield would repeat the current limitation. Real photography, a stable type plane and a single optical mask provide a more specific cinematic effect with little runtime code. Award-winning references inform composition and rhythm, not a claim that this implementation has won awards or that their heavier interaction models are universally usable.
