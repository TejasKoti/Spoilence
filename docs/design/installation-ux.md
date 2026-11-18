# Spoilence installation and control design

## Brief and decisions

Give people one package, an obvious starting point and a short path to protection. Automatically choose browser instructions and packaged resources. Keep source/build details out of installation. Browser permissions remain explicit; an unsigned development extension cannot silently install itself. Safari resources require the documented temporary route or separately approved signed distribution.

Use a single quiet canvas with a curtain-like concealment demonstration as the distinctive element. Keep the installation action and availability state prominent. Reveal advanced settings progressively in the extension. Persist changes immediately and give a clear saved/error status.

## Tokens

- Canvas: porcelain `#F5F6FA`.
- Text: midnight blue `#172339`.
- Action: iris `#5B4DF5`.
- Selected surface: pale iris `#ECEBFF`.
- Secondary text: slate `#61708A`.
- Positive status: forest `#146A54`.
- Typography: Segoe UI Variable / Segoe UI on Windows, platform system fonts elsewhere; no external font downloads. Display 48–64 px, section 24 px, body 16 px, helper 14 px. Left align instructions and controls, limit body text to 65 characters per line.

## Layout

```text
Spoilence                                      Local protection
Keep the story yours.              [concealed sample / reveal]
One download. Setup matched to your device.

Windows / detected browser
[Start browser setup]               clear development-build status
1  Open browser settings
2  Load the supplied extension
3  Reload your page

Other devices                      Troubleshooting
```

The browser-only offline guide routes browser identities to one engine folder. A single browser catalog supports Chrome, Edge, Brave, Opera/GX, Vivaldi, Firefox-compatible forks and Mac Safari. Manual override handles concealed browser identities. No native app download or executable installer remains.

## Review against the brief

One large installer area replaces the earlier list of unrelated archives and developer commands. A curtain preview explains concealment without real spoilers. The main action changes to match the platform. Source, models, shared packages, tooling and build output all live in `backend`; all test source and results live in `tests`. Superseded artifacts and caches move to `Trash` with a migration record.

Accessibility: native buttons/inputs, explicit labels, 44 px touch targets, visible keyboard focus, live status, no autoplay, reduced motion, responsive layouts and empty/error states with recovery actions. No user-content storage or network requests are added.

## Imported guidance

- [Anthropic frontend-design](https://github.com/anthropics/skills/tree/e4bb5d960d87126ff3b3a8af1a104b7db67560ba/skills/frontend-design), installed in the user's Codex skills directory.
- [Vercel web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/web-design-guidelines), installed in the same directory. Current [guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) reviewed for the setup and popup.

The skills are development guidance only. No skill code or online dependency is added to the product runtime.
