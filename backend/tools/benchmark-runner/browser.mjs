import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const content = await readFile('build/extensions/chromium/content.js', 'utf8'),
    css = await readFile('build/extensions/chromium/guard.css', 'utf8');
  const cards = Array.from(
    { length: 300 },
    (_, i) =>
      `<ytd-video-renderer><h2>${i % 2 ? 'Gardening sample' : 'GTA VI fictional ending'}</h2></ytd-video-renderer>`,
  ).join('');
  await page.route('https://www.youtube.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><style>ytd-video-renderer{display:block;height:60px}</style><body>${cards}</body>`,
    }),
  );
  await page.goto('https://www.youtube.com/feed');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.collectGarbage');
  const before = await cdp.send('Runtime.getHeapUsage');
  await page.evaluate(() => {
    window.fixtureLongTasks = [];
    new PerformanceObserver((list) =>
      window.fixtureLongTasks.push(...list.getEntries().map((e) => e.duration)),
    ).observe({ type: 'longtask', buffered: false });
    const listeners = [];
    window.chrome = {
      storage: {
        local: { get: async () => ({}) },
        onChanged: { addListener: (listener) => listeners.push(listener) },
      },
    };
    window.fixtureToggle = (enabled) =>
      listeners.forEach((listener) => listener({ settings: { newValue: { enabled } } }, 'local'));
  });
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content });
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.ssReady === 'true' &&
      !document.querySelector('[data-ss-queued]'),
  );
  await cdp.send('HeapProfiler.collectGarbage');
  const after = await cdp.send('Runtime.getHeapUsage');
  const toggles = [];
  for (let i = 0; i < 50; i++) {
    toggles.push(
      await page.evaluate(
        (enabled) => {
          const start = performance.now();
          window.fixtureToggle(enabled);
          return performance.now() - start;
        },
        i % 2 === 1,
      ),
    );
    await page.waitForFunction(() => !document.querySelector('[data-ss-queued]'));
  }
  const frames = await page.evaluate(async () => {
    const times = [];
    let last = performance.now();
    for (let i = 0; i < 60; i++) {
      await new Promise(requestAnimationFrame);
      const now = performance.now();
      times.push(now - last);
      last = now;
      window.scrollBy(0, 12);
    }
    return { intervals: times, longTasks: window.fixtureLongTasks };
  });
  const percentile = (values) => values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)];
  const metrics = {
    browser: browser.version(),
    syntheticCards: 300,
    toggleSamples: 50,
    toggleSynchronousEffectP95Ms: percentile(toggles),
    incrementalJSHeapMB: (after.usedSize - before.usedSize) / 2 ** 20,
    frameIntervalP95Ms: percentile(frames.intervals),
    framesOver34ms: frames.intervals.filter((t) => t > 34).length,
    longTaskCount: frames.longTasks.length,
    longestTaskMs: Math.max(0, ...frames.longTasks),
    limitations: [
      'JS heap is not total renderer/tab memory',
      'Automated host is not designated low-end hardware',
      'Headless synthetic workload is not a real-site scroll benchmark',
    ],
  };
  await mkdir('../tests/results', { recursive: true });
  await writeFile(
    '../tests/results/browser-benchmark.json',
    JSON.stringify(metrics, null, 2) + '\n',
  );
  console.log(JSON.stringify(metrics));
} finally {
  await browser.close();
}
