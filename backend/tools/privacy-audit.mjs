import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`,
      ),
    )
  ).flat();
}
const runtime = (await files('browser-extension/src'))
  .concat((await files('packages')).filter((f) => !f.includes('test-fixtures')))
  .concat(await files('setup-guide'))
  .filter((f) => /\.(ts|js|html)$/.test(f));
for (const path of runtime) {
  const source = await readFile(path, 'utf8');
  assert(
    !/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|indexedDB|console\.(?:log|error|warn))\s*[.(]/.test(
      source,
    ),
    `Disallowed runtime I/O in ${path}`,
  );
}
for (const platform of ['chromium', 'firefox', 'safari']) {
  const manifest = JSON.parse(await readFile(`build/extensions/${platform}/manifest.json`, 'utf8'));
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.deepEqual(manifest.content_scripts[0].js, ['guard.js', 'content.js']);
  assert(manifest.content_scripts.every((c) => c.run_at === 'document_start'));
  assert.deepEqual(
    manifest.background,
    platform === 'firefox' ? { scripts: ['background.js'] } : { service_worker: 'background.js' },
  );
  assert(manifest.content_security_policy.extension_pages.includes("connect-src 'none'"));
}
console.log(
  `Static privacy audit passed (${runtime.length} source files). Runtime offline/storage tests are a separate gate.`,
);
