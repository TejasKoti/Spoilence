Shared behavior contracts
=========================

All runtime modules are source TypeScript, bundled into each web extension. Native Android ports the v1 behavior and consumes the same JSON rule pack and conformance fixtures. Native binaries do not load TypeScript. Every result contains safe enum reasons rather than matched text.

Dependency direction:

```text
detection-contracts <- rule-packs <- rule-engine
settings-schema + detection-contracts <- decision-engine
privacy-cache (independent)
image-analysis-contracts (independent, provider optional)
test-fixtures (test data only)
rule-engine/rule-import <- tools/rule-validation
```

`classifyText` returns a tri-state decision and a deterministic risk score. Scores are heuristics, not calibrated probabilities. Aggressive conceals every uncertain result; Balanced conceals BLOCK; Custom applies the chosen threshold to non-ALLOW results. Empty text is uncertain. Safe phrases remove their own generic spoiler token only; a concrete story-risk term still blocks.

The normalizer caps input at 32,768 characters, removes formatting/diacritics, folds selected confusable characters, and normalizes spaced or punctuated GTA aliases. The rules use token boundaries and a single-edit tolerance for risk tokens of at least five characters. Detection beyond the cap, unsupported languages, visual-only material, aliases absent from the pack, or heavy obfuscation remains a coverage gap. Common character names can cause false positives. Aggressive mode intentionally hides some harmless topic-related content.

`DecisionCache` accepts random opaque keys from `createOpaqueKey()` or per-session HMAC keys from `SessionHasher`. Callers must not use raw content as keys. Entries expire against both wall and monotonic time at the exact maximum age; reads and repeated writes never change creation time. A backwards clock change discards the entire cache. Resume must call `resume()`, which clears then sweeps: browsers differ in whether their monotonic clocks advance during OS sleep, and clearing avoids trusting a wall-clock correction that conceals the sleep interval. OFF, permission loss, and Clear Data must call `clear()`. No cache exports, serialization, disk API, or logging API exists.

The static-image queue accepts decoded pixels only and cannot fetch media. Providers must cooperate with AbortSignal and release image/text buffers on cancellation. No provider or model ships enabled; queue tests alone do not demonstrate OCR recall, memory use, or device energy performance. A provider must pass platform and profiling gates before activation.

Manual rule imports require independent SHA-256 verification, bounded data-only schema validation, and immutable arrays. A checksum proves integrity against the supplied digest; it does not establish the publisher's identity or make an untrusted pack trustworthy. No regular expressions, scripts, URLs, or executable callbacks are interpreted from imported packs.

`test-fixtures/conformance.json` contains fabricated, non-spoiler examples and is language neutral. Separate obvious and balanced holdouts are also fabricated. Passing them verifies the local behavior contract only. The release target of 98% recall and 95% precision on a representative held-out corpus remains an external acceptance gate. Test output should contain IDs and aggregate metrics only.
