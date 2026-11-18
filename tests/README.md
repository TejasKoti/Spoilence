# Spoilence tests

- unit, integration, conformance, privacy: shared text/cache/DOM/settings tests.
- e2e: browser behavior and installation routing, including every browser catalog entry.
- product: isolated ZIP extraction, runtime-file integrity, native-binary exclusion and actual extracted-extension filtering.
- results: generated reports and synthetic-only UI previews.

Run from backend: pnpm check, pnpm package, pnpm test:e2e, pnpm test:product. Product tests require the newly packaged output. Native app and executable-launcher tests are archived in Trash alongside the removed implementations.

Website tests live in `website/` within this test tree. Run `pnpm test:website` from backend after installing the separate website Wrangler dependencies. They start a local Wrangler server, run three engines, and write synthetic screenshots/timing reports under results.
