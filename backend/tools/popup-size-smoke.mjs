/* global chrome, innerWidth, document, getComputedStyle */
import { chromium } from '@playwright/test';
import { mkdtemp, rm, realpath, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const extension = path.resolve('build/extensions/chromium');
const profile = await mkdtemp(path.join(tmpdir(), 'spoilence-popup-size-'));
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
try {
  const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
  // Exercise the real toolbar action. A normal tab does not verify popup auto-sizing.
  await worker.evaluate(() => chrome.action.openPopup());
  // Headless Chromium omits toolbar views from Playwright's page collection.
  // Attach to the real target via CDP rather than substituting a normal tab.
  const cdp = await context.browser().newBrowserCDPSession();
  const { targetInfos } = await cdp.send('Target.getTargets');
  const target = targetInfos.find(
    (target) => target.url.startsWith('chrome-extension://') && target.url.endsWith('/popup.html'),
  );
  assert(target, 'Toolbar popup target was not created');
  const { sessionId } = await cdp.send('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: false,
  });
  let sequence = 0;
  const pending = new Map();
  cdp.on('Target.receivedMessageFromTarget', (event) => {
    if (event.sessionId !== sessionId) return;
    const message = JSON.parse(event.message),
      item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    if (message.error) item.reject(Error(message.error.message));
    else item.resolve(message.result);
  });
  function command(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      cdp
        .send('Target.sendMessageToTarget', {
          sessionId,
          message: JSON.stringify({ id, method, params }),
        })
        .catch(reject);
    });
  }
  const result = await command('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
    (async()=>{await document.fonts.ready;return (${(() => ({
      viewport: innerWidth,
      root: document.documentElement.getBoundingClientRect().width,
      body: document.body.getBoundingClientRect().width,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      logoLoaded:
        document.querySelector('.brand-logo').complete &&
        document.querySelector('.brand-logo').naturalWidth > 0,
      scrollbar: getComputedStyle(document.documentElement).scrollbarColor,
    scrollbarWidth: getComputedStyle(document.documentElement, '::-webkit-scrollbar').width,
    scrollbarTrack: getComputedStyle(document.documentElement, '::-webkit-scrollbar-track').backgroundColor,
    })).toString()})();})()`,
  });
  const dimensions = result.result.value;
  assert.equal(dimensions.body, 760);
  assert(dimensions.viewport >= 760, `Native popup clipped: ${JSON.stringify(dimensions)}`);
  assert.equal(dimensions.horizontalOverflow, false);
  assert.equal(dimensions.logoLoaded, true);
  assert.equal(dimensions.scrollbarWidth, '4px');
  assert.equal(dimensions.scrollbarTrack, 'rgba(0, 0, 0, 0)');
  await mkdir('../tests/results/ui', { recursive: true });
  const capture = await command('Page.captureScreenshot', { format: 'png' });
  await writeFile(
    '../tests/results/ui/native-toolbar-popup.png',
    Buffer.from(capture.data, 'base64'),
  );
  await writeFile(
    '../tests/results/popup-width.json',
    JSON.stringify({ passed: true, actualToolbarAction: true, ...dimensions }, null, 2) + '\n',
  );
  console.log(JSON.stringify(dimensions));
} finally {
  await context.close();
  assert.equal(path.dirname(await realpath(profile)), await realpath(tmpdir()));
  assert(path.basename(profile).startsWith('spoilence-popup-size-'));
  await rm(profile, { recursive: true, force: true });
}
