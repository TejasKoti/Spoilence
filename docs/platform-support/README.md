# Browser compatibility

Spoilence is now a desktop browser-extension project. No native app or executable installer is delivered. Engine compatibility gives a setup route, not proof that every fork works.

| Family / product folder | Browser choices                                                   | Evidence / limitations                                                                                                   |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| chromium                | Chrome, Chromium, Edge                                            | Prior actual installed Chromium and Edge validation passed. Branded Chrome runtime pending. Chromium 120+ APIs required. |
| chromium                | Brave, Opera, Opera GX, Vivaldi                                   | Matching installation routes included; individual browser runtime validation pending.                                    |
| chromium                | Other modern Chrome-extension browsers                            | Use the generic option. Browser must support MV3, storage, document-start content scripts and service workers.           |
| firefox                 | Firefox                                                           | Prior actual installed Firefox validation passed. Firefox 121+ required; temporary unsigned installs disappear on exit.  |
| firefox                 | ESR, Developer Edition, Nightly, LibreWolf, Waterfox, Zen, Floorp | Matching routes / compatibility candidates; individual runtimes pending. Fork security policies may restrict APIs.       |
| firefox                 | Other modern Firefox-extension browsers                           | Use generic option only when compatible with Firefox 121+ WebExtensions. Legacy XUL-only browsers are unsupported.       |
| safari                  | Safari 18.4+ on macOS                                             | Temporary extension folder route documented; actual Mac Safari test pending. No signed store release.                    |

Mobile browsers, embedded webviews, browsers without WebExtensions, and restricted managed profiles are outside this release. A shared rendering engine alone does not guarantee extension support. It is not possible to promise every public browser. No APK/IPA or mobile installation route is offered.

The offline guide infers the browser when its identity is exposed, selects the correct family automatically, and retains an override. Opera GX can report the same identity as Opera; privacy browsers may identify as Chrome or Firefox. Both still map to the correct family. Nothing switches the user's default browser or silently installs extensions.

Browser registry: backend/browser-targets.json. New compatible browsers reuse an existing family; new APIs require a separately tested manifest/build target. Actual installed-extension reports remain separate from setup-routing tests.

Official compatibility / installation references reviewed 2026-11-17:

- [Opera developer installation](https://help.opera.com/en/extensions/testing/)
- [Brave Chrome-extension compatibility](https://brave.com/learn/using-chrome-extensions-in-brave/)
- [Vivaldi extensions](https://help.vivaldi.com/desktop/appearance-customization/extensions/)
- [Safari temporary installation](https://developer.apple.com/documentation/safariservices/building-and-testing-a-safari-web-extension)

Detailed prior evidence: [Edge](edge-validation.md) and [Firefox](firefox-validation.md). Playwright WebKit is not actual Safari.
