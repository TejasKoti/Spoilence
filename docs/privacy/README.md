# Privacy and cache lifecycle

Normal detection is local. The runtime has no fetch, XHR, WebSocket, telemetry, server, crash reporter, account or remote inference. Browser permissions are restricted to storage and four explicit website origins. Ordinary website, browser, build-tool and OS traffic are outside this product's control.

## Data inventory

| Data                                                            | Location                                               | Lifetime                                            |
| --------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Page text                                                       | Local variable during bounded classification           | Released after processing; never written by product |
| Detection decisions                                             | Bounded memory cache                                   | At most 24 hours from creation; often shorter       |
| Browser cache key                                               | Random per-element 128-bit identifier in WeakMap       | Session only                                        |
| ON/OFF, mode, sensitivity, site preferences                     | Extension local storage                                | Until reset/uninstall                               |
| Rule import                                                     | Strictly validated JSON plus manually verified SHA-256 | Until full reset/uninstall                          |
| Screenshots, OCR text, browsing histories, per-item diagnostics | Not persisted by product                               | No disk cache exists                                |

Raw content is never a cache key. No screenshot capture or OCR provider is enabled in the shipping build. Optional static-image interfaces cannot fetch URLs and are isolated from storage. Rule imports are optional assets, not browsing data; do not paste private browsing text into rule files. The UI explains that SHA-256 requires a trusted independently obtained checksum and does not authenticate a publisher.

## Hard expiration

Both wall and monotonic creation times limit every entry. Age **>=86,400,000 ms** rejects and deletes a result on access. Reads, repeated writes and LRU movement never extend the initial creation time. Clock rollback discards the cache. Browser resume clears results before reprocessing. Startup starts empty. Browser cleanup schedules the earliest expiration. Suspended processes cannot run timers, so lookup always rechecks expiration.

OFF, Clear Data, site disable, supported permission lifecycle events clear decisions. Full reset erases imported rules and preferences as well. WebExtension disable/uninstall gives content scripts no reliable final callback: browser-managed storage is removed on uninstall, process-local decisions become unreachable, and **reload existing tabs to remove already-injected covers/inline inert styles**. The extension cannot clear another site's or the OS's data.

An event-only background worker relays `permissions.onRemoved` to all open supported content scripts. Each receiver disables that page session, restores its items and clears results conservatively. Browser-specific access controls that do not emit that event still need manual permission-revocation validation. See [Chrome permissions events](https://developer.chrome.com/docs/extensions/reference/api/permissions) and [Firefox background variants](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background).

## Audits

`pnpm audit:privacy` rejects network/persistence/logging APIs in browser runtime source and checks manifest least privilege/CSP. `pnpm test:installed` loads the actual Chromium extension, classifies offline, checks requests and inspects extension-owned storage. E2E tests use synthetic page text only. Unit tests cover exact 23:59:59 / 24:00:00, repeated access/write, clock skew, resume, capacity and cleanup. Reports contain counts/timings, never page text or screenshots. These checks do not replace browser-specific runtime network and storage audits before release.

## Threat model

Protect against accidental exposure on supported layouts, stale caches, unsafe imports and accidental product data retention. Websites own their DOM, can change selectors and may deliberately interfere with injected controls. Another installed extension, a compromised browser or a malicious host is outside the trust boundary. CSS/DOM filtering is not a security boundary against a hostile website. Keep dependency updates manual, locked and reviewed; remote executable rules are prohibited.
