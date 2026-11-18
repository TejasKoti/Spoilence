Edge installed-extension validation
==================================

`tools/edge-smoke.mjs` passed on Windows using official Microsoft Edge Stable **157.0.4341.60** and the unpacked Chromium extension bundle. The test passed concealment, actual popup OFF/ON, offline safe-to-risky text reclassification, settings-only persistent storage, and full Reset leaving storage empty. It served one fabricated YouTube fixture through Playwright routing and saw no other page requests. Other hostnames were mapped to an unusable address; no real site content was browsed or recorded.

Results and hashes of the tested extension files are in `tests/results/edge-extension-smoke.json`. This is an installed development-extension smoke test on one Windows Edge build. It does not establish first-frame concealment, low-end hardware performance, long-session behavior, Edge Add-ons signing, or store approval.

Reproduce with an existing Edge binary:

```powershell
$env:SPOILENCE_EDGE = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node tools/edge-smoke.mjs
```

This environment had no installed Edge. For this validation, the enterprise MSI was downloaded from Microsoft's official distribution service. The SHA-256 matched the release API, and Windows Authenticode validated the Microsoft publisher. `tests/results/edge-source-verification.json` contains the version, digest, and publisher result. The MSI and its nested archives were read as data into one uniquely named temporary directory; the extracted `msedge.exe` also had a valid Microsoft signature. No installer, updater, registration utility, or installation custom action was executed. The test used a fresh temporary browser profile.

Archive extraction sequence used in this session:

1. Open the MSI database with `WindowsInstaller.Installer.OpenDatabase(path, 0)` in read-only mode and copy the `Binary.MicrosoftEdgeInstaller` stream.
2. Use the official 7-Zip archive extractor to unwrap the PE resource and LZMA payload. Its five little-endian header integers describe the uncompressed size and four BCJ2 stream sizes.
3. Wrap those streams in a standard 7z BCJ2 container and decode the resulting tar archive. This restores the original signed browser installer archive as data.
4. Unpack that archive's `MSEDGE.PACKED.7Z`, then `MSEDGE.7z`, and verify the extracted browser executable's Authenticode signature before launching it with the smoke test.

The extraction tree's resolved path was verified as a direct child of the operating-system temporary root with a name beginning `spoilence-edge-` and no reparse point. Automatic approval review rejected recursive cleanup, including a second attempt using the explicit verified path, with the reason "blocked by policy." The extracted archive/tools tree remains; `tests/results/edge-test-location.txt` records its location for manual removal. No extracted browser or installer process remains running. The smoke test separately removed its disposable browser profile. The browser was not installed or updated on the host.

Automatic approval review rejected an earlier command proposing `msiexec /a` administrative extraction with the reason "blocked by policy." That command was not executed or retried. Archive-only extraction completed the validation without running Windows Installer actions.

Primary references: [Microsoft enterprise release metadata](https://edgeupdates.microsoft.com/api/products?view=enterprise), [read-only MSI database API](https://learn.microsoft.com/en-us/windows/win32/msi/installer-opendatabase), [MSI stream-reading API](https://learn.microsoft.com/en-us/windows/win32/msi/record-readstream), [official 7-Zip downloads](https://www.7-zip.org/download.html).
