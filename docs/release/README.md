# Browser release gates and rollback

This is an unsigned development extension package, not a store-approved release.

Before release, run pnpm check, pnpm package, pnpm test:e2e, pnpm test:product and the installed-extension checks. Review package-info.json and its hashes. Test each browser claimed as validated; routing tests alone do not certify a browser. Validate Mac Safari directly before claiming Safari support beyond the documented temporary route.

Open gates: representative held-out obvious recall >=98%, balanced precision >=95%, real-site/language/layout extraction coverage, screen reader and permission-revocation behavior, designated low-end p95/memory/idle/scroll measurements, dependency/security review and signing/store review. Synthetic fixtures cannot satisfy representative accuracy or real-device performance gates. OCR/classifiers remain disabled without measured value.

Chrome/Edge store distribution and Mozilla signing need separately authorized publication and credentials. A ZIP is not a signed CRX or XPI. Safari's signed distribution is also separate from loading a temporary folder. Mobile apps and executable installers are removed from scope.

Rollback: turn protection OFF, reset imported rules/settings if necessary, and reload tabs after disabling/removing an extension to clear injected covers. Keep the previous approved browser package and source revision. Reproduce defects with synthetic fixtures; never collect user browsing content. CI definitions are not evidence of a hosted CI run.
