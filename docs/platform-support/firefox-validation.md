Firefox installed-extension validation
=====================================

The development smoke test installs the actual `backend/build/extensions/firefox` bundle into a disposable Firefox session. It does not mock the WebExtensions storage API or inject the content script through the automation harness. It serves fabricated HTML through loopback HTTPS; its local proxy rejects every destination except that fixture. It does not visit the real YouTube service.

Executed on Windows with Playwright-managed Firefox **159.0**, Selenium **4.51.0**, and geckodriver **0.37.1**. The test passed:

- Temporary installation of the unsigned development extension.
- Concealment of a fabricated topic-risk card.
- Actual extension popup OFF/ON settings and restored/reconcealed content.
- Dynamic safe text becoming allowed, then risky text becoming concealed.
- Persisted storage containing non-content settings only.
- Full Clear Data leaving extension storage empty.
- One local fixture request and zero nonfixture proxy requests.

Aggregate results and hashes of the tested bundle are in `tests/results/firefox-extension-smoke.json`. This validates one installed Firefox engine/build. It does not establish first-frame concealment, long-session memory use, stock stable Firefox compatibility, AMO signing, or store approval. Those remain independent release checks.

Reproduce after building:

```powershell
# Download geckodriver separately from the official Mozilla release page.
$env:SPOILENCE_GECKODRIVER = 'C:\path\to\geckodriver.exe'
# Optional: use a specific stock Firefox rather than the Playwright-managed binary.
$env:SPOILENCE_FIREFOX = 'C:\Program Files\Mozilla Firefox\firefox.exe'
# Optional when Git for Windows OpenSSL is not installed at its usual path.
$env:SPOILENCE_OPENSSL = 'C:\path\to\openssl.exe'
node tools/firefox-smoke.mjs
```

The script generates a disposable self-signed certificate and accepts it only in the test browser session. It makes no system trust-store or hosts-file changes. It verifies the temporary directory is directly inside the operating-system temporary root and has the test prefix before recursively deleting that directory. Geckodriver owns and removes its anonymous browser profile when the session quits.

The executable path is explicit to prevent Selenium Manager from trying to download a driver through the fixture-only browser proxy. Selenium tool statistics are disabled. Current geckodriver requires `--allow-system-access` for automated navigation to the extension popup; the test applies it to its disposable local driver session. Product manifests and runtime do not use that flag.

Primary references: [Selenium Firefox Driver API](https://www.selenium.dev/selenium/docs/api/javascript/module-selenium-webdriver_firefox-Driver.html), [Mozilla geckodriver release and system-access change](https://github.com/mozilla/geckodriver/releases/tag/v0.37.1), [geckodriver usage](https://firefox-source-docs.mozilla.org/testing/geckodriver/Usage.html).
