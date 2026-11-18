import {
  cp,
  mkdir,
  readFile,
  writeFile,
  realpath,
  lstat,
  rename,
} from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const website = fileURLToPath(new URL("../", import.meta.url));
const root = path.resolve(website, ".."),
  product = path.join(root, "product");
const publicRoot = path.join(website, "public"),
  downloads = path.join(publicRoot, "downloads");
for (const dir of [publicRoot, product])
  if ((await lstat(dir)).isSymbolicLink() || (await realpath(dir)) !== dir)
    throw Error("Redirected input/output");
const info = JSON.parse(
  await readFile(path.join(product, "package-info.json"), "utf8"),
);
if (!info.browserOnly || !info.standalone || !info.downloads)
  throw Error("Browser archives required");
const verified = [];
for (const browser of info.browsers) {
  if (
    !Object.hasOwn(info.families, browser.family) ||
    !/^[a-z]+$/.test(browser.family)
  )
    throw Error("Invalid browser family");
  const entry = info.downloads[browser.id];
  if (
    !/^[a-z0-9-]+$/.test(browser.id) ||
    entry.filename !== `spoilence_${browser.id}.zip` ||
    entry.path !== `${browser.family}/${entry.filename}`
  )
    throw Error("Invalid archive path");
  const source = path.join(product, entry.path),
    bytes = await readFile(source);
  if (!path.resolve(source).startsWith(product + path.sep))
    throw Error("Unsafe archive input");
  if (
    (await lstat(source)).isSymbolicLink() ||
    createHash("sha256").update(bytes).digest("hex") !== entry.sha256 ||
    bytes.length !== entry.bytes
  )
    throw Error("Archive integrity failure");
  verified.push({ source, entry });
}
try {
  if (
    (await lstat(downloads)).isSymbolicLink() ||
    (await realpath(downloads)) !== downloads
  )
    throw Error("Redirected downloads");
  const trash = path.join(root, "Trash");
  await mkdir(trash, { recursive: true });
  if (
    (await realpath(trash)) !== trash ||
    path.dirname(downloads) !== publicRoot
  )
    throw Error("Unsafe archive destination");
  await rename(
    downloads,
    path.join(trash, `website-downloads-${randomUUID()}`),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await mkdir(downloads);
for (const { source, entry } of verified)
  await cp(source, path.join(downloads, entry.filename));
await writeFile(
  path.join(downloads, "package-info.json"),
  JSON.stringify(info, null, 2) + "\n",
);
await writeFile(
  path.join(publicRoot, "browser-catalog.js"),
  `window.SPOILENCE_BROWSERS = ${JSON.stringify({ families: info.families, browsers: info.browsers, downloads: info.downloads, release: { version: info.version } })};\n`,
);
console.log(
  `Synced ${verified.length} browser-specific Spoilence ${info.version} archives. Each ZIP has a root manifest.`,
);
