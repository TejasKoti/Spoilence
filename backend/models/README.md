# Static-image capability gate

No model or OCR provider is bundled or downloaded by the released development build. Rules-only is the default. `packages/image-analysis-contracts` defines a bounded single-job cancellable interface for already-available static pixels; it has no URL/media/transport API.

A provider must pass local licensing/integrity checks, demonstrate incremental recall on a separately held-out image corpus, and meet measured low-end latency/memory/energy budgets before being enabled. Cross-origin canvas restrictions are respected; no thumbnail is refetched merely to classify it. There is no audio/video analysis or roadmap for it.
