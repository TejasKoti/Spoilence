import { readFile, readdir, lstat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import vm from "node:vm";
const website = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(website, "public");
const files = [];
async function walk(dir) {
  assert(
    !(await lstat(dir)).isSymbolicLink(),
    "Public assets cannot be linked",
  );
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    assert(!entry.isSymbolicLink(), "Public assets cannot be linked");
    if (entry.isDirectory()) await walk(file);
    else {
      assert(!/\.(exe|apk|ipa|aab|msi|map)$/i.test(file));
      files.push(file);
    }
  }
}
const catalog = await readFile(
  path.join(publicRoot, "browser-catalog.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.runInNewContext(catalog, sandbox, { timeout: 500 });
const release = sandbox.window.SPOILENCE_BROWSERS.release;
const termsVersion = "2026-11-17.1";
assert(
  (await readFile(path.join(publicRoot, "terms.html"), "utf8")).includes(
    `content="${termsVersion}"`,
  ),
  "Terms version mismatch",
);
const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const choices = sandbox.window.SPOILENCE_BROWSERS.browsers
  .map((browser) => {
    const file =
      sandbox.window.SPOILENCE_BROWSERS.downloads[browser.id].filename;
    assert(
      /^[a-z0-9-]+$/.test(browser.id) && file === `spoilence_${browser.id}.zip`,
    );
    return `<section id="${browser.id}" class="download-choice"><h2>${escapeHtml(browser.name)}</h2><form action="/downloads/${file}" method="get"><label><input type="checkbox" required aria-label="Accept terms for ${escapeHtml(browser.name)}"> I agree to the <a href="/terms.html">Terms of Use</a>.</label><button class="button button-peach" type="submit">Accept and download</button></form></section>`;
  })
  .join("");
await writeFile(
  path.join(publicRoot, "download.html"),
  `<!doctype html><html lang="en" class="spoilence-page"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Download terms : Spoilence</title><link rel="icon" href="/assets/favicon.png"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/cinematic.css"><link rel="stylesheet" href="/download-gate.css"></head><body class="reference-site"><a class="skip-link" href="#main">Skip to downloads</a><header class="site-header wrap"><a class="wordmark" href="/">spoilence</a><a href="/terms.html">Full terms</a></header><main id="main" class="wrap legal-page" tabindex="-1"><h1>Before you download.</h1><p>Spoilence is provided <strong>AS IS and AS AVAILABLE</strong>, without warranties to the fullest extent permitted by law. It can miss spoilers, hide safe content or stop working when websites change. Its operator and contributors limit liability where the law permits. Nonwaivable rights remain unaffected.</p><p>Read the <a href="/terms.html">full Terms of Use</a> and <a href="/privacy.html">Privacy Notice</a>. Choose your browser, then explicitly accept before starting its download. Terms version ${termsVersion}. Acceptance is not saved; no account is required.</p>${choices}</main><footer class="site-footer wrap"><a href="/">Back to Spoilence</a><a href="/terms.html">Terms</a></footer></body></html>\n`,
);
await walk(publicRoot);
const archiveHashes = {};
for (const browser of sandbox.window.SPOILENCE_BROWSERS.browsers) {
  const download = sandbox.window.SPOILENCE_BROWSERS.downloads[browser.id];
  assert.equal(download.filename, `spoilence_${browser.id}.zip`);
  const zip = await readFile(
    path.join(publicRoot, "downloads", download.filename),
  );
  assert.equal(zip.length, download.bytes);
  assert.equal(createHash("sha256").update(zip).digest("hex"), download.sha256);
  archiveHashes[browser.id] = download.sha256;
}
const manifest = JSON.parse(
  await readFile(path.join(publicRoot, "downloads/package-info.json"), "utf8"),
);
assert.equal(manifest.browserOnly, true);
let total = 0,
  sourceBytes = 0;
for (const file of files) {
  const bytes = await readFile(file);
  total += bytes.length;
  if (/\.(html|css|js|svg)$/.test(file)) {
    sourceBytes += bytes.length;
    const source = bytes.toString("utf8");
    if (/\.(html|js)$/.test(file))
      assert(
        !source.includes("\u2014"),
        "Website copy must not include em dashes",
      );
    for (const match of source.matchAll(/url\(["']?(\/[^"')]+)["']?\)/g)) {
      const target = path.resolve(publicRoot, "." + match[1]);
      assert(target.startsWith(publicRoot + path.sep));
      assert((await lstat(target)).isFile(), `Missing CSS asset ${match[1]}`);
    }
    for (const match of source.matchAll(/(?:src|href)=["'](\/[^"'#?]*)["']/g)) {
      const target = path.resolve(publicRoot, "." + match[1]);
      assert(target === publicRoot || target.startsWith(publicRoot + path.sep));
      if (target !== publicRoot)
        assert((await lstat(target)).isFile(), `Missing asset ${match[1]}`);
    }
    if (/\.js$/.test(file)) {
      new vm.Script(source, { filename: file });
      assert(
        !/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/.test(
          source,
        ),
        "Unexpected runtime I/O",
      );
    }
    assert(
      !/(?:src|href)=["']https?:/i.test(source),
      "External runtime dependency",
    );
  }
}
assert(sourceBytes < 150000, "Keep the site source lightweight");
const headers = await readFile(path.join(publicRoot, "_headers"), "utf8");
assert(headers.includes("connect-src 'none'"));
assert(headers.includes("frame-ancestors 'none'"));
assert(await lstat(path.join(publicRoot, "assets/fonts/InterVariable.woff2")));
assert(
  await lstat(
    path.join(publicRoot, "assets/fonts/JetBrainsMono-Regular.woff2"),
  ),
);
await mkdir(path.join(website, ".wrangler"), { recursive: true });
await writeFile(
  path.join(website, ".wrangler/build-validation.json"),
  JSON.stringify(
    {
      passed: true,
      files: files.length,
      bytes: total,
      sourceBytes,
      version: release.version,
      downloadHashes: archiveHashes,
      noExternalRuntime: true,
      noNativeArtifacts: true,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Static website verified: ${files.length} files, ${sourceBytes} source bytes, ${total} total bytes. Ready for Wrangler; nothing deployed.`,
);
