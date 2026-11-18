import { chromium } from '@playwright/test';
import { mkdir, readFile, rm, mkdtemp, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const temporary = await mkdtemp(path.join(tmpdir(), 'spoilence-ui-preview-')),
  extension = path.resolve('build/extensions/chromium');
const { key } = JSON.parse(await readFile(path.join(extension, 'manifest.json'), 'utf8'));
const id = [...createHash('sha256').update(Buffer.from(key, 'base64')).digest('hex').slice(0, 32)]
  .map((c) => String.fromCharCode(97 + parseInt(c, 16)))
  .join('');
const context = await chromium.launchPersistentContext(temporary, {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
try {
  await mkdir('../tests/results/ui', { recursive: true });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(pathToFileURL(path.resolve('../product/START-HERE.html')).href);
  await page.screenshot({ path: '../tests/results/ui/setup-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    pathToFileURL(path.resolve('../product/START-HERE.html')).href +
      '?device=desktop&browser=opera-gx',
  );
  await page.screenshot({ path: '../tests/results/ui/setup-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto(`chrome-extension://${id}/popup.html`);
  await page.locator('#controls:not([disabled])').waitFor();
  await page.locator('body').screenshot({ path: '../tests/results/ui/extension-popup.png' });
  console.log('Rendered synthetic-only setup and extension UI previews.');
} finally {
  await context.close();
  assert.equal(path.dirname(await realpath(temporary)), await realpath(tmpdir()));
  assert(path.basename(temporary).startsWith('spoilence-ui-preview-'));
  await rm(temporary, { recursive: true, force: true });
}
