/* global getComputedStyle */
import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const extension = path.resolve('build/extensions/chromium');
const { key } = JSON.parse(await readFile(`${extension}/manifest.json`, 'utf8'));
const id = [...createHash('sha256').update(Buffer.from(key, 'base64')).digest('hex').slice(0, 32)]
  .map((char) => String.fromCharCode(97 + parseInt(char, 16)))
  .join('');
const profile = path.join(tmpdir(), `spoilence-smoke-${crypto.randomUUID()}`);
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
try {
  const requests = [];
  context.on('request', (request) => requests.push(request.url()));
  await context.route('https://www.youtube.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body><ytd-rich-item-renderer><div><img width="320" height="180" alt="GTA VI fictional ending"></div><h2 id="video-title">GTA VI fictional ending</h2><span id="channel-name">Safe channel</span><span id="metadata-line">24K views</span><ytd-thumbnail-overlay-time-status-renderer>12:42</ytd-thumbnail-overlay-time-status-renderer></ytd-rich-item-renderer></body></html>',
    }),
  );
  const page = await context.newPage();
  await page.goto('https://www.youtube.com/feed');
  await page.waitForSelector('[data-ss-state="blur"]', { state: 'attached' });
  assert.equal(
    await page.locator('img').evaluate((image) => getComputedStyle(image).filter),
    'blur(32px)',
  );
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.waitForFunction(() => document.querySelector('#enabled').checked);
  assert.equal(await popup.locator('#mode-blur').isChecked(), true);
  await popup.locator('#mode-hide').check();
  await page.waitForSelector('[data-ss-state="hide"]', { state: 'attached' });
  assert.equal(await page.locator('h2').isVisible(), false);
  const accessibility = await (
    await context.newCDPSession(page)
  ).send('Accessibility.getFullAXTree');
  assert.equal(await page.locator('ytd-rich-item-renderer').isVisible(), false);
  assert.equal(await page.locator('[data-ss-owned]').count(), 0);
  assert(
    !accessibility.nodes.some(
      (node) => !node.ignored && String(node.name?.value ?? '').includes('fictional ending'),
    ),
  );
  await popup.locator('#enabled').uncheck();
  await page.locator('html[data-ss-off]').waitFor();
  assert.equal(await page.locator('h2').isVisible(), true);
  await popup.locator('#enabled').check();
  await page.waitForSelector('[data-ss-state="hide"]', { state: 'attached' });
  await popup.locator('#mode-blur').check();
  await page.waitForSelector('[data-ss-state="blur"]', { state: 'attached' });
  await page.bringToFront();
  assert.equal(await page.locator('#channel-name').textContent(), 'Safe channel');
  assert.equal(await page.locator('#metadata-line').textContent(), '24K views');
  assert.equal(
    await page.locator('[data-ss-replacement-title]').textContent(),
    'Spoilence Protected - GTA 6 Leak',
  );
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.activeElement?.matches('[data-ss-owned]')));
  await page.keyboard.press('Enter');
  await page.waitForSelector('[data-ss-replacement-title]', { state: 'detached' });
  assert.equal(await page.locator('h2').textContent(), 'GTA VI fictional ending');
  await popup.locator('#sensitivity').fill('2');
  await popup.locator('#sensitivity').dispatchEvent('change');
  await popup.locator('#customThreshold').fill('0.75');
  await popup.locator('#customThreshold').dispatchEvent('change');
  await popup.waitForFunction(async () => {
    const state = (await chrome.storage.local.get('settings')).settings;
    return state?.sensitivity === 'custom' && state.customThreshold === 0.75;
  });
  await popup.locator('#mode-hide').check();
  await page.waitForSelector('[data-ss-state="hide"]', { state: 'attached' });
  await context.setOffline(true);
  await page.evaluate(() => {
    document.querySelector('h2').textContent = 'GTA VI fictional betrayal';
  });
  await page.waitForSelector('[data-ss-state="hide"]', { state: 'attached' });
  const storage = await popup.evaluate(() => chrome.storage.local.get(null));
  assert.deepEqual(Object.keys(storage), ['settings']);
  assert(!JSON.stringify(storage).includes('fictional'));
  const detectionRequests = requests.filter(
    (url) => !url.startsWith(`chrome-extension://${id}/`) && url !== 'https://www.youtube.com/feed',
  );
  assert.deepEqual(detectionRequests, []);
  await popup.getByText('Advanced', { exact: true }).click();
  await popup.getByText('Reset preferences and imports', { exact: true }).click();
  await popup.getByRole('button', { name: 'Reset all local data' }).click();
  await popup.getByRole('button', { name: 'Reset Spoilence', exact: true }).click();
  await popup.waitForFunction(async () => !(await chrome.storage.local.get('settings')).settings);
  const remaining = await popup.evaluate(() => chrome.storage.local.get(null));
  assert.deepEqual(Object.keys(remaining), []);
  await page.waitForSelector('[data-ss-state="blur"]', { state: 'attached' });
  await popup.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    await Promise.allSettled(
      tabs
        .filter((tab) => tab.url?.startsWith('https://www.youtube.com/'))
        .map((tab) => chrome.tabs.sendMessage(tab.id, { type: 'shield-permission-revoked' })),
    );
  });
  await page.locator('html[data-ss-off]').waitFor();
  assert.equal(await page.locator('h2').isVisible(), true);
  await mkdir('../tests/results', { recursive: true });
  await writeFile(
    '../tests/results/extension-smoke.json',
    JSON.stringify(
      {
        passed: true,
        browser: context.browser()?.version(),
        installedUnpacked: true,
        offlineReclassification: true,
        settingsStorageAudit: true,
        keyboardReveal: true,
        automaticSettingsSave: true,
        concealedAccessibilityTextExcluded: true,
        detectionRequests: detectionRequests.length,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Installed Chromium extension passed concealment, popup toggle, offline, storage and Clear Data checks.',
  );
} finally {
  await context.close();
  assert.equal(path.dirname(path.resolve(profile)), path.resolve(tmpdir()));
  assert(path.basename(profile).startsWith('spoilence-smoke-'));
  await rm(profile, { recursive: true, force: true });
}
