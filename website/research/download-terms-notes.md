# Spoilence download terms: source and implementation notes

Drafted November 17, 2026. Public document: `public/terms.html`. Terms version: **2026-11-17.1**. This is a project-specific draft for review, not a legal opinion, an enforceability certification or a promise of immunity. A qualified lawyer familiar with the operator, audience, distribution model and applicable jurisdictions should review the published wording and agreement flow. No operator identity or jurisdiction was supplied, so neither was invented.

## Supplied reference and deliberate changes

The full user-provided file `C:/Users/Astrio/.codex/attachments/cae00410-8de0-4ea3-8f54-5953fb271269/Pasted text.txt` was read. It is an Astrio/Frostborn protected-archive and account policy dated August 21, 2026. It is not Spoilence's existing policy.

The draft keeps useful plain-language organization and adapts warranty/risk concepts to a browser extension that can miss spoilers, produce false positives and lose compatibility when layouts change. It does not copy the reference's accounts, profile limits, minor-account policy, donations, inspection restrictions, email address, archive access rules, indemnity obligations, informal-dispute process or governing-law language. Those facts and mechanisms do not describe this product. There is no invented legal entity, contact address, arbitration scheme or choice of a state's law.

The personal-use permission covers downloading, installing and using the extension. It is not a new general open-source license or a restriction on rights already granted by an independently applicable component license. Rockstar and other third-party rights remain separate.

## Primary legal and licensing references

- [UCC section 2-316, text reproduced by Cornell's Legal Information Institute](https://www.law.cornell.edu/ucc/2/2-316). This illustrates why a disclaimer may need conspicuous wording and named warranty concepts. It is not a conclusion that this model-code section governs free software, this download, every US state or this operator. Actual enacted law and the transaction matter.
- [UCC section 2-719, Cornell LII](https://www.law.cornell.edu/ucc/2/2-719). The text itself limits the effect of remedy restrictions and consequential-loss exclusions. It supports avoiding an absolute liability claim, without establishing that Article 2 governs this project.
- [Directive (EU) 2019/770, official EUR-Lex text, especially Article 22](https://eur-lex.europa.eu/eli/dir/2019/770/oj/eng). This provides an example of mandatory consumer protections that contractual language cannot simply displace. Whether the directive, its national implementations or other rules apply depends on scope and facts. A free product with no account or personal-data consideration should not be assumed to fall within every digital-content rule.
- [The MIT License, Open Source Initiative](https://opensource.org/license/mit). This is an authoritative example of software warranty-disclaimer terminology, not the license chosen for Spoilence. No MIT permission grant or full liability clause was inserted into the download terms.

The public page uses original, product-specific prose and prominent AS IS / AS AVAILABLE headings. It preserves nonwaivable consumer and statutory rights, legally required remedies, and liability for fraud or willful misconduct. It deliberately makes no universal enforceability claim and no claim that accepting terms prevents every lawsuit or remedy.

## Version and interface contract

- URL: `/terms.html`.
- Version string: `2026-11-17.1`.
- Effective date: November 17, 2026.
- Machine-readable meta: `meta[name="spoilence-terms-version"]`.
- Visible version: `#terms-version`.
- Main document: `main#main[data-terms-version="2026-11-17.1"]`.
- Important sections: `#software-limits` and `#protected-rights`.

The page reuses the existing privacy-page shell, local assets and dark legal-page CSS. It links to home, browser setup and Privacy. It contains no JavaScript, acceptance storage or direct ZIP links. Parent-owned frontend changes implement the accessible checkbox/dialog before each website download request and route non-JavaScript download entry points to this page. Merely opening this document or having accepted an earlier download is not described as acceptance of a new version.

The frontend must keep the visible version, dialog copy and acceptance action in sync. Agreement should start unchecked on every download request; cancellation must not download. The selected browser archive should remain identifiable. The flow must have keyboard focus, clear labels and ordinary access to the full terms without accepting first. Do not quietly turn agreement into analytics or unrelated privacy consent.

## Technical and legal limits of this flow

This is a frontend-only acknowledgement before the ordinary website download controls. It has no acceptance-history database, signed receipt, account identity or server-side authorization check. No proof of who agreed or when is created by the application. A publicly hosted ZIP remains retrievable through its direct URL or another client, and a local product folder is outside the website gate. The gate is not secure access control or a guarantee that every file retrieval involved acceptance. Do not claim otherwise in UI, privacy copy, release notes or tests.

The current application intentionally keeps no acceptance record, consistent with the site's no-storage design. Ordinary hosting request metadata remains a separate matter described by the Privacy page. A no-JavaScript route to the terms page provides notice; by itself it does not prove agreement. If future requirements include authenticated acceptance, durable evidence, jurisdiction-specific consent or restricted file delivery, that requires a separate architecture/privacy/legal decision.

No legal review, jurisdictional analysis or final agreement-flow test is claimed by this drafting task. Final automated and visual checks must run after the parent integrates the page and dialog.
