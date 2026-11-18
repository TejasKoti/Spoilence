import { cp, mkdir, readFile, writeFile, rename, lstat, realpath, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
async function move(source, destination) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await rename(source, destination);
    } catch (error) {
      if (!['EBUSY', 'EPERM', 'EACCES'].includes(error.code) || attempt >= 4) throw error;
      await delay(250 * (attempt + 1));
    }
  }
}
const backend = await realpath(process.cwd()),
  root = path.dirname(backend);
if (path.basename(backend) !== 'backend') throw Error('Run packaging from backend.');
const target = path.join(root, 'product');
const catalog = JSON.parse(await readFile('browser-targets.json', 'utf8'));
const { version } = JSON.parse(await readFile('browser-extension/package.json', 'utf8'));
const stage = path.join(backend, 'build', `product-${randomUUID()}`);
await mkdir(stage, { recursive: true });
await cp('setup-guide', stage, { recursive: true });
const families = Object.fromEntries(
  Object.entries(catalog.families).map(([key, { label, minimum }]) => [key, { label, minimum }]),
);
const payloads = {},
  downloads = {};
async function inventory(dir, base = dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw Error('Archive inputs cannot contain links');
    if (entry.isDirectory()) result.push(...(await inventory(file, base)));
    else {
      const relative = path.relative(base, file).replaceAll('\\', '/');
      if (
        !/^(manifest\.json|(?:content|guard|ui|background)\.js|(?:guard|ui)\.css|popup\.html|fonts\/[a-zA-Z0-9.-]+\.(?:woff2|txt)|icons\/icon-(?:16|32|48|128)\.png)$/.test(
          relative,
        )
      )
        throw Error(`Nonessential runtime file: ${relative}`);
      const bytes = await readFile(file);
      result.push({
        path: relative,
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
  return result.sort((a, b) => a.path.localeCompare(b.path));
}
for (const [family, info] of Object.entries(catalog.families)) {
  if (!/^[a-z]+$/.test(family) || info.source !== `build/extensions/${family}`)
    throw Error('Invalid family source');
  payloads[family] = await inventory(path.resolve(info.source));
  const manifest = JSON.parse(await readFile(path.join(info.source, 'manifest.json'), 'utf8'));
  if (manifest.name !== 'Spoilence' || manifest.version !== version)
    throw Error(`Stale ${family} build. Run pnpm build before packaging.`);
  if (!payloads[family].some((file) => file.path === 'manifest.json'))
    throw Error('Missing root manifest');
  await mkdir(path.join(stage, family));
}
function zip(source, archive) {
  if (process.platform === 'win32') {
    const script =
      "$ErrorActionPreference='Stop';Add-Type -AssemblyName System.IO.Compression;Add-Type -AssemblyName System.IO.Compression.FileSystem;$src=$env:SPOILENCE_PACKAGE_SOURCE;$zip=[IO.Compression.ZipFile]::Open($env:SPOILENCE_PACKAGE_ARCHIVE,[IO.Compression.ZipArchiveMode]::Create);try{foreach($file in Get-ChildItem -LiteralPath $src -Recurse -File){$rel=$file.FullName.Substring($src.Length+1).Replace('\\','/');[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,$rel,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}}finally{$zip.Dispose()}";
    const result = spawnSync('powershell', ['-NoProfile', '-Command', script], {
      windowsHide: true,
      stdio: 'inherit',
      env: { ...process.env, SPOILENCE_PACKAGE_SOURCE: source, SPOILENCE_PACKAGE_ARCHIVE: archive },
    });
    if (result.status !== 0) throw Error('ZIP creation failed');
  } else {
    const result = spawnSync('zip', ['-qr', archive, '.'], { cwd: source, stdio: 'inherit' });
    if (result.status !== 0) throw Error('ZIP creation requires zip');
  }
}
// Identical engine payloads share one built archive; users receive browser-specific names.
for (const [family, info] of Object.entries(catalog.families)) {
  const entries = catalog.browsers.filter((browser) => browser.family === family);
  const first = path.join(stage, family, `spoilence_${entries[0].id}.zip`);
  zip(path.resolve(info.source), first);
  for (const browser of entries) {
    if (!/^[a-z0-9-]+$/.test(browser.id)) throw Error('Invalid browser name');
    const filename = `spoilence_${browser.id}.zip`,
      relative = `${family}/${filename}`;
    const output = path.join(stage, relative);
    if (output !== first) await cp(first, output);
    const bytes = await readFile(output);
    downloads[browser.id] = {
      filename,
      path: relative,
      folder: `spoilence_${browser.id}`,
      family,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  }
}
const info = {
  name: 'Spoilence',
  version,
  standalone: true,
  browserOnly: true,
  developmentBuild: true,
  requiresBrowserConsent: true,
  families,
  browsers: catalog.browsers,
  downloads,
  payloads,
};
await writeFile(path.join(stage, 'package-info.json'), JSON.stringify(info, null, 2) + '\n');
await writeFile(
  path.join(stage, 'browser-catalog.js'),
  `window.SPOILENCE_BROWSERS = ${JSON.stringify({ families, browsers: catalog.browsers, downloads, release: { version } })};\n`,
);
await writeFile(
  path.join(stage, 'READ-ME.txt'),
  'Spoilence browser downloads\nOpen START-HERE.html, choose your browser and save its named ZIP.\nExtract that ZIP into a permanent folder. The manifest is directly inside the extracted folder.\nNo nested browser-family directory, installer, app, source code or backend is needed.\nFirefox is an unsigned temporary install; Safari is Mac-only and awaits actual Mac validation.\nNo detection network traffic. No audio or video analysis.\n',
);
// Both resolved paths must remain within this named workspace before archiving old output.
for (const dir of [target, path.join(root, 'Trash')]) {
  if (path.dirname(dir) !== root) throw Error('Unsafe output path');
  try {
    if ((await lstat(dir)).isSymbolicLink() || (await realpath(dir)) !== dir)
      throw Error('Redirected output');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
await mkdir(path.join(root, 'Trash'), { recursive: true });
try {
  await lstat(target);
  await move(target, path.join(root, 'Trash', `previous-product-${randomUUID()}`));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await move(stage, target);
await mkdir('../tests/results', { recursive: true });
await writeFile(
  '../tests/results/package.json',
  JSON.stringify({ name: 'Spoilence', version, browserOnly: true, downloads }, null, 2) + '\n',
);
console.log(
  `Packaged ${Object.keys(downloads).length} browser-specific ZIPs with root manifests across 3 shared runtime builds.`,
);
