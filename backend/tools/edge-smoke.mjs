/* global document, chrome */
import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile, rm, mkdtemp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

assert(
  process.env.SPOILENCE_EDGE,
  'Set SPOILENCE_EDGE to a verified standalone or installed Edge executable',
);
const extension = path.resolve('build/extensions/chromium');
const { key } = JSON.parse(await readFile(path.join(extension, 'manifest.json'), 'utf8'));
const id = [...createHash('sha256').update(Buffer.from(key, 'base64')).digest('hex').slice(0, 32)]
  .map((char) => String.fromCharCode(97 + parseInt(char, 16)))
  .join('');
const profile = await mkdtemp(path.join(tmpdir(), 'spoilence-edge-profile-'));
let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: process.env.SPOILENCE_EDGE,
    headless: true,
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
      '--host-resolver-rules=MAP * 0.0.0.0',
      '--disable-background-networking',
      '--disable-component-update',
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });
  let fixtureRequests = 0,
    blockedRequests = 0;
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url === 'https://www.youtube.com/feed') {
      fixtureRequests++;
      return route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html><head><link rel="icon" href="data:,"></head><body><ytd-rich-item-renderer><h2>GTA VI fictional ending</h2></ytd-rich-item-renderer></body></html>',
      });
    }
    if (url.startsWith(`chrome-extension://${id}/`)) return route.continue();
    blockedRequests++;
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto('https://www.youtube.com/feed');
  await page.waitForSelector('[data-ss-state="blur"]', { state: 'attached' });
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.waitForFunction(() => document.querySelector('#enabled').checked);
  await popup.locator('#mode-hide').check();
  await page.waitForSelector('[data-ss-state="hide"]', { state: 'attached', timeout: 10_000 });
  assert.equal(await page.locator('h2').isVisible(), false);
  await popup.locator('#enabled').uncheck();
  await page.locator('html[data-ss-off]').waitFor();
  assert.equal(await page.locator('h2').isVisible(), true);
  await popup.locator('#enabled').check();
  await page.waitForSelector('[data-ss-state="hide"]', { state: 'attached' });
  await context.setOffline(true);
  await page.locator('h2').evaluate((node) => {
    node.textContent = 'Gardening synthetic fixture';
  });
  await page.waitForSelector('[data-ss-state="allowed"]', { state: 'attached' });
  assert.equal(await page.locator('h2').isVisible(), true);
  await page.locator('h2').evaluate((node) => {
    node.textContent = 'GTA VI fictional betrayal';
  });
  await page.waitForSelector('[data-ss-state="hide"]', { state: 'attached' });
  assert.equal(await page.locator('h2').isVisible(), false);
  const storage = await popup.evaluate(() => chrome.storage.local.get(null));
  assert.deepEqual(Object.keys(storage), ['settings']);
  assert.equal(JSON.stringify(storage).includes('fictional'), false);
  await popup.getByText('Advanced', { exact: true }).click();
  await popup.getByText('Reset preferences and imports', { exact: true }).click();
  await popup.getByRole('button', { name: 'Reset all local data' }).click();
  await popup.getByRole('button', { name: 'Reset Spoilence', exact: true }).click();
  await popup.waitForFunction(async () => !(await chrome.storage.local.get('settings')).settings);
  const remaining = await popup.evaluate(() => chrome.storage.local.get(null));
  assert.deepEqual(Object.keys(remaining), []);
  assert.equal(fixtureRequests, 1);
  assert.equal(blockedRequests, 0);
  const bundleSha256 = {};
  for (const file of [
    'manifest.json',
    'content.js',
    'background.js',
    'guard.js',
    'guard.css',
    'ui.js',
    'popup.html',
    'ui.css',
  ])
    bundleSha256[file] = createHash('sha256')
      .update(await readFile(path.join(extension, file)))
      .digest('hex');
  await mkdir('../tests/results', { recursive: true });
  await writeFile(
    '../tests/results/edge-extension-smoke.json',
    JSON.stringify(
      {
        passed: true,
        browser: 'Microsoft Edge',
        version: context.browser()?.version(),
        installedUnpacked: true,
        popupToggle: true,
        offlineReclassification: true,
        settingsStorageAudit: true,
        clearData: true,
        syntheticFixtureRequests: fixtureRequests,
        blockedRequests,
        bundleSha256,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Installed Edge extension passed synthetic concealment, popup toggle, offline mutation, storage and Clear Data checks.',
  );
} finally {
  if (context) await context.close();
  assert.equal(path.dirname(path.resolve(profile)), path.resolve(tmpdir()));
  assert(path.basename(profile).startsWith('spoilence-edge-profile-'));
  await rm(profile, { recursive: true, force: true });
}
