import assert from 'node:assert/strict';
import { createServer as createHttpsServer } from 'node:https';
import { createServer as createProxyServer } from 'node:http';
import { connect } from 'node:net';
import { mkdtemp, readdir, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Builder, By } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

// Only fabricated HTML is served. A loopback CONNECT proxy rejects every other
// destination, so this smoke test cannot browse real YouTube content.
const temporary = await mkdtemp(path.join(tmpdir(), 'spoilence-firefox-'));
process.env.SE_AVOID_STATS ??= 'true';
process.env.SE_TIMEOUT ??= '30';
const extensionId = 'spoilence@local.invalid';
const extensionUuid = '604f2158-c97c-4e3c-bd97-ef044204cb7d';
let driver, fixtureServer, proxyServer;
const connections = new Set();
let fixtureRequests = 0,
  blockedProxyRequests = 0;
try {
  const openssl =
    process.env.SPOILENCE_OPENSSL ??
    (process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin/openssl.exe' : 'openssl');
  const config = path.join(temporary, 'openssl.cnf');
  await writeFile(
    config,
    '[req]\ndistinguished_name=dn\nprompt=no\nx509_extensions=v3\n[dn]\nCN=www.youtube.com\n[v3]\nsubjectAltName=DNS:www.youtube.com\n',
  );
  const certificate = spawnSync(
    openssl,
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      '1',
      '-keyout',
      path.join(temporary, 'key.pem'),
      '-out',
      path.join(temporary, 'cert.pem'),
      '-config',
      config,
    ],
    { windowsHide: true, encoding: 'utf8' },
  );
  assert.equal(
    certificate.status,
    0,
    'Local test certificate generation failed; set SPOILENCE_OPENSSL',
  );
  fixtureServer = createHttpsServer(
    {
      key: await readFile(path.join(temporary, 'key.pem')),
      cert: await readFile(path.join(temporary, 'cert.pem')),
    },
    (request, response) => {
      fixtureRequests++;
      if (request.url === '/feed') {
        response.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        });
        response.end(
          '<!doctype html><html><head><link rel="icon" href="data:,"></head><body><ytd-rich-item-renderer><h2>GTA VI fictional ending</h2></ytd-rich-item-renderer></body></html>',
        );
      } else {
        response.writeHead(204);
        response.end();
      }
    },
  );
  await new Promise((resolve) => fixtureServer.listen(0, '127.0.0.1', resolve));
  const fixturePort = fixtureServer.address().port;
  proxyServer = createProxyServer((request, response) => {
    blockedProxyRequests++;
    response.writeHead(502);
    response.end();
  });
  proxyServer.on('connect', (request, socket, head) => {
    if (request.url !== `www.youtube.com:${fixturePort}`) {
      blockedProxyRequests++;
      socket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      return;
    }
    const upstream = connect(fixturePort, '127.0.0.1', () => {
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) upstream.write(head);
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
    connections.add(socket);
    connections.add(upstream);
    socket.on('close', () => {
      connections.delete(socket);
      upstream.destroy();
    });
    upstream.on('close', () => {
      connections.delete(upstream);
      socket.destroy();
    });
  });
  await new Promise((resolve) => proxyServer.listen(0, '127.0.0.1', resolve));
  const proxyPort = proxyServer.address().port;
  let binary = process.env.SPOILENCE_FIREFOX;
  if (!binary) {
    const browsers = path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
    const installed = (await readdir(browsers))
      .filter((name) => /^firefox-\d+$/.test(name))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    assert(installed.length, 'Set SPOILENCE_FIREFOX to an installed Firefox binary');
    binary = path.join(
      browsers,
      installed[0],
      'firefox',
      process.platform === 'win32' ? 'firefox.exe' : 'firefox',
    );
  }
  const options = new firefox.Options()
    .setBinary(binary)
    .addArguments('-headless')
    .setAcceptInsecureCerts(true)
    .setPreference(
      'extensions.webextensions.uuids',
      JSON.stringify({ [extensionId]: extensionUuid }),
    )
    .setPreference('extensions.webextensions.host-permissions.ignoreUnsigned', true)
    .setPreference('datareporting.healthreport.uploadEnabled', false)
    .setPreference('toolkit.telemetry.enabled', false)
    .setPreference('app.update.auto', false)
    .setProxy({
      proxyType: 'manual',
      httpProxy: `127.0.0.1:${proxyPort}`,
      sslProxy: `127.0.0.1:${proxyPort}`,
      noProxy: [],
    });
  const builder = new Builder().forBrowser('firefox').setFirefoxOptions(options);
  assert(
    process.env.SPOILENCE_GECKODRIVER,
    'Set SPOILENCE_GECKODRIVER to a geckodriver executable',
  );
  // Required by current Firefox to automate extension-origin pages. This flag
  // applies only to the disposable local test session, never the product.
  builder.setFirefoxService(
    new firefox.ServiceBuilder(process.env.SPOILENCE_GECKODRIVER).addArguments(
      '--allow-system-access',
    ),
  );
  driver = await builder.build();
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 20_000, script: 10_000 });
  const installed =
    typeof driver.installWebExtension === 'function'
      ? await driver.installWebExtension(path.resolve('build/extensions/firefox'), {
          permanent: false,
        })
      : await driver.installAddon(path.resolve('build/extensions/firefox'), true);
  assert(installed, 'Extension installation did not return an identifier');
  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  await driver.wait(async () => await driver.findElement(By.id('mode-blur')).isSelected(), 10_000);
  await driver.findElement(By.id('mode-hide')).click();
  await driver.get(`https://www.youtube.com:${fixturePort}/feed`);
  const fixtureTab = await driver.getWindowHandle();
  await driver.wait(
    async () =>
      await driver.executeScript('return document.querySelector("[data-ss-state=hide]") !== null'),
    10_000,
    'Installed extension did not conceal fixture',
  );
  assert.equal(await driver.findElement(By.css('h2')).isDisplayed(), false);
  await driver.switchTo().newWindow('tab');
  const popupTab = await driver.getWindowHandle();
  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  await driver.wait(async () => await driver.findElement(By.id('enabled')).isSelected(), 10_000);
  await driver.findElement(By.id('enabled')).click();
  await driver.switchTo().window(fixtureTab);
  await driver.wait(
    async () =>
      await driver.executeScript('return document.documentElement.hasAttribute("data-ss-off")'),
    10_000,
  );
  assert.equal(await driver.findElement(By.css('h2')).isDisplayed(), true);
  await driver.switchTo().window(popupTab);
  await driver.findElement(By.id('enabled')).click();
  await driver.switchTo().window(fixtureTab);
  await driver.wait(
    async () =>
      await driver.executeScript('return document.querySelector("[data-ss-state=hide]") !== null'),
    10_000,
  );
  const requestsBeforeMutation = fixtureRequests;
  await driver.executeScript(
    'document.querySelector("h2").textContent = "Gardening and flower care synthetic fixture"',
  );
  await driver.wait(
    async () =>
      await driver.executeScript(
        'return document.querySelector("[data-ss-state=allowed]") !== null',
      ),
    10_000,
  );
  assert.equal(await driver.findElement(By.css('h2')).isDisplayed(), true);
  await driver.executeScript(
    'document.querySelector("h2").textContent = "GTA VI fictional betrayal"',
  );
  await driver.wait(
    async () =>
      await driver.executeScript('return document.querySelector("[data-ss-state=hide]") !== null'),
    10_000,
  );
  assert.equal(await driver.findElement(By.css('h2')).isDisplayed(), false);
  assert.equal(fixtureRequests, requestsBeforeMutation);
  await driver.switchTo().window(popupTab);
  const storage = await driver.executeAsyncScript(
    'const done=arguments[arguments.length-1];browser.storage.local.get(null).then(done)',
  );
  assert.deepEqual(Object.keys(storage), ['settings']);
  assert.equal(JSON.stringify(storage).includes('fictional'), false);
  await driver.findElement(By.xpath('//summary[normalize-space()="Advanced"]')).click();
  await driver
    .findElement(By.xpath('//summary[normalize-space()="Reset preferences and imports"]'))
    .click();
  await driver.findElement(By.id('fullClear')).click();
  await driver.findElement(By.id('confirmReset')).click();
  await driver.wait(
    async () =>
      await driver.executeAsyncScript(
        'const done=arguments[arguments.length-1];browser.storage.local.get(null).then(value=>done(Object.keys(value).length===0))',
      ),
    10_000,
  );
  const capabilities = await driver.getCapabilities();
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
      .update(await readFile(path.join('build/extensions/firefox', file)))
      .digest('hex');
  await mkdir('../tests/results', { recursive: true });
  await writeFile(
    '../tests/results/firefox-extension-smoke.json',
    JSON.stringify(
      {
        passed: true,
        browser: capabilities.get('browserName'),
        version: capabilities.get('browserVersion'),
        binaryDistribution: binary.includes('ms-playwright') ? 'playwright-managed' : 'configured',
        geckodriver: capabilities.get('moz:geckodriverVersion'),
        temporaryExtensionInstalled: true,
        concealment: true,
        popupToggle: true,
        localMutationClassification: true,
        settingsStorageAudit: true,
        clearData: true,
        syntheticFixtureRequests: fixtureRequests,
        blockedNonfixtureProxyRequests: blockedProxyRequests,
        bundleSha256,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Installed Firefox extension passed synthetic concealment, popup toggle, local mutation, storage and Clear Data checks.',
  );
} finally {
  if (driver) await driver.quit();
  for (const socket of connections) socket.destroy();
  if (proxyServer) await new Promise((resolve) => proxyServer.close(resolve));
  if (fixtureServer) await new Promise((resolve) => fixtureServer.close(resolve));
  assert.equal(path.dirname(path.resolve(temporary)), path.resolve(tmpdir()));
  assert(path.basename(temporary).startsWith('spoilence-firefox-'));
  await rm(temporary, { recursive: true, force: true });
}
