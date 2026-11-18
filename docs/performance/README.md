# Measurement protocol

All recorded data here uses fictional synthetic fixtures. The designated low-end desktop is unavailable; that gate remains open. Native app measurements are archived outside the active browser-only scope.

Measured 2026-11-16 on Windows x64, Intel Core i5-12500H, 16 logical CPUs, 16 GB RAM, Node 24.21.0:

| Measurement                |  Observed | Workload / caveat                                                  |
| -------------------------- | --------: | ------------------------------------------------------------------ |
| Text rules p95             | 0.0158 ms | 20,000 warmed classifications, 390-character synthetic card        |
| Cache lookup p95           | 0.0004 ms | 20,000 memory lookups; timer disabled for microbenchmark           |
| Toggle effect p95          |    3.6 ms | 50 alternating toggles, Chromium 159, 300-card synthetic page      |
| Additional JS heap         |   0.93 MB | Collected heap delta, 300 cards; **not total tab/renderer memory** |
| Scroll frame interval p95  |   18.2 ms | 60 frames, headless synthetic scroll                               |
| Frames >34 ms / long tasks |     0 / 0 | Short synthetic workload, not real-site certification              |

Reproduce with `pnpm benchmark` and `node tools/benchmark-runner/browser.mjs`. Machine-readable results are in `tests/results/benchmark.json` and `tests/results/browser-benchmark.json`. Results vary with host scheduling. Rule/cache target failures return a nonzero exit code; browser reports measurements without pretending this host is low-end hardware.

## Detection evidence

The separate synthetic holdouts contain only 12 obvious-positive cases and a 24-case balanced set. Balanced sensitivity measured 100% recall/precision on those fixtures. Aggressive sensitivity measured 100% obvious recall, 85.71% balanced precision and 16.67% false-positive rate because it deliberately conceals uncertain topic-only text. Per-content-type metrics are emitted in the benchmark JSON. **These small, developer-authored fixtures are not representative held-out evidence and do not satisfy the >=98% recall / >=95% precision release targets.**

Before release, commission a separately reviewed, representative fictional/labelled corpus stratified by platform, language, title/caption/comment/metadata, obfuscation and safe GTA discussion. Freeze labels before evaluating. Report confidence intervals and per-platform false positives; do not tune against the held-out set. Safari uses shared web logic but still requires extraction/visibility checks in Safari.

## Image capability gate

No OCR or classifier is enabled. Cross-origin thumbnails often cannot be read from the page canvas without fetching or privileged capture; this product never refetches them. The static-image queue is bounded, serial and cancellable, with no media/network API. A provider requires a bundled/native local OCR implementation, already-available permitted static pixels, incremental recall/precision evidence and low-end memory/latency profiling. Without that evidence, enabling heavyweight OCR would violate the plan's default-value gate. No model is downloaded at runtime.

## Required hardware baseline

Use a low-end desktop. Record OS/browser/CPU/RAM, power mode, thermal state, 10-minute idle/scroll baselines with protection on/off, full renderer working set and long tasks/frame drops. The <30MB budget concerns total incremental tab memory, not just JavaScript heap. Retain synthetic-only reports. No designated low-end certification is claimed.
