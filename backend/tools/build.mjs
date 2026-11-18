import { build } from 'esbuild';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
const base = 'browser-extension';
const { version } = JSON.parse(await readFile(`${base}/package.json`, 'utf8'));
const publicKey = JSON.parse(await readFile(`${base}/public-key.json`, 'utf8')).key;
const selectors = (
  await Promise.all(
    ['youtube', 'instagram', 'tiktok'].map(
      async (site) =>
        JSON.parse(await readFile(`${base}/src/adapters/${site}/selectors.json`, 'utf8')).selector,
    ),
  )
).join(',');
const guard = (await readFile(`${base}/src/content/guard.css`, 'utf8')).replaceAll(
  '__CARD_SELECTORS__',
  selectors,
);
const matches = [
  'https://www.youtube.com/*',
  'https://m.youtube.com/*',
  'https://www.instagram.com/*',
  'https://www.tiktok.com/*',
];
for (const target of ['chromium', 'firefox', 'safari']) {
  const outdir = `build/extensions/${target}`;
  await mkdir(outdir, { recursive: true });
  await build({
    entryPoints: {
      content: `${base}/src/content/index.ts`,
      guard: `${base}/src/content/startup-guard.ts`,
      ui: `${base}/src/popup/ui.ts`,
      background: `${base}/src/background/index.ts`,
    },
    outdir,
    bundle: true,
    format: 'esm',
    target: ['chrome120', 'firefox121', 'safari17'],
    minify: true,
    legalComments: 'none',
  });
  // Content scripts are classic scripts, not modules; bundle has no exports/imports.
  await writeFile(`${outdir}/guard.css`, guard);
  await cp(`${base}/src/popup/index.html`, `${outdir}/popup.html`);
  await cp(`${base}/src/popup/ui.css`, `${outdir}/ui.css`);
  await cp(`${base}/src/popup/fonts`, `${outdir}/fonts`, { recursive: true });
  await cp(`${base}/assets/icons`, `${outdir}/icons`, { recursive: true });
  const html = await readFile(`${outdir}/popup.html`, 'utf8');
  await writeFile(
    `${outdir}/popup.html`,
    html
      .replace('<script src="ui.js">', '<script type="module" src="ui.js">')
      .replaceAll('__SPOILENCE_VERSION__', version),
  );
  const manifest = {
    manifest_version: 3,
    name: 'Spoilence',
    version,
    description: 'Local spoiler concealment for supported websites. No detection network traffic.',
    permissions: ['storage'],
    host_permissions: matches,
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' },
    },
    options_ui: { page: 'popup.html', open_in_tab: true },
    content_scripts: [
      { matches, css: ['guard.css'], js: ['guard.js', 'content.js'], run_at: 'document_start' },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none'; connect-src 'none'",
    },
    ...(target === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'spoilence@local.invalid',
              strict_min_version: '121.0',
              data_collection_permissions: { required: ['none'] },
            },
          },
        }
      : {}),
  };
  manifest.background =
    target === 'firefox' ? { scripts: ['background.js'] } : { service_worker: 'background.js' };
  if (target === 'chromium') manifest.key = publicKey;
  await writeFile(`${outdir}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
}
console.log('Built Chromium, Firefox and Safari development resources.');
