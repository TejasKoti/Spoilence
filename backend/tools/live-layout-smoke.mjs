/* global document */
import { chromium } from '@playwright/test';
import { mkdir, writeFile, rm, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
// Explicit developer-only live navigation. Reports contain counts, never page text/URLs/screenshots.
const profile = await mkdtemp(path.join(tmpdir(), 'spoilence-live-layout-'));
const extension = path.resolve('build/extensions/chromium');
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium',
  headless: true,
  args: [
    `--disable-extensions-except=${extension}`,
    `--load-extension=${extension}`,
    '--mute-audio',
  ],
});
const surfaces = [
  ['youtube-feed', 'https://www.youtube.com/feed/explore'],
  ['youtube-search', 'https://www.youtube.com/results?search_query=GTA+VI'],
  ['instagram', 'https://www.instagram.com/'],
  ['tiktok', 'https://www.tiktok.com/'],
];
const results = [];
try {
  for (const [surface, url] of surfaces) {
    const page = await context.newPage();
    let navigation = 'loaded';
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
    } catch {
      navigation = 'unavailable-or-timeout';
    }
    const counts = await page
      .evaluate(() => ({
        initialized: document.documentElement.dataset.ssReady === 'true',
        guarded: document.querySelectorAll('[data-ss-state="hide"],[data-ss-state="blur"]').length,
        allowed: document.querySelectorAll('[data-ss-state="allowed"]').length,
        pending: document.querySelectorAll('[data-ss-queued]').length,
      }))
      .catch(() => ({ initialized: false, guarded: 0, allowed: 0, pending: 0 }));
    results.push({ surface, navigation, ...counts, coverageProven: false });
    await page.close();
  }
  await mkdir('../tests/results', { recursive: true });
  await writeFile(
    '../tests/results/live-layout-smoke.json',
    JSON.stringify(
      {
        date: new Date().toISOString(),
        anonymous: true,
        results,
        limitations: [
          'Live layout discovery only; no representative accuracy or all-surface coverage claim',
          'Login, bot controls, consent and regional differences may prevent content access',
          'No real page text, screenshots or browsing identifiers were retained in this report',
        ],
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify(results));
} finally {
  await context.close();
  assert.equal(path.dirname(path.resolve(profile)), path.resolve(tmpdir()));
  assert(path.basename(profile).startsWith('spoilence-live-layout-'));
  await rm(profile, { recursive: true, force: true });
}
