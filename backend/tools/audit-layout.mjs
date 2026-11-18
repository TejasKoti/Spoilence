import { readdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const backend = await realpath(process.cwd()),
  root = path.dirname(backend),
  trash = path.join(root, 'Trash').toLowerCase();
for (const name of ['apps', 'packages', 'models', 'dist', 'artifacts', 'node_modules'])
  assert(!(await readdir(root)).includes(name), `Unexpected old top-level directory: ${name}`);
for (const name of ['android', 'ios', 'installer'])
  assert(!(await readdir(backend)).includes(name), `Removed native project is active: ${name}`);
const skip = new Set(['node_modules', 'build', 'results', 'Resources', '.gradle']);
let checked = 0;
async function source(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await source(file);
    else if (/\.(ts|mjs|js|cs|kt|java|swift|xml|plist|pbxproj)$/.test(file)) {
      const text = await readFile(file, 'utf8');
      assert(
        path.basename(file) === 'audit-layout.mjs' ||
          !/Spoiler\s?Shield|gta6-spoiler-shield|@shield\/|org\.spoilershield/.test(text),
        `Old branding: ${path.relative(root, file)}`,
      );
      for (const match of text.matchAll(/(?:from\s*|import\s*\()(['"])(\.{1,2}\/[^'"\r\n]+)\1/g))
        assert(
          !path
            .resolve(path.dirname(file), match[2])
            .toLowerCase()
            .startsWith(trash + path.sep),
          'Source import depends on Trash',
        );
      checked++;
    }
  }
}
await source(backend);
await source(path.join(root, 'tests'));
const seen = new Set();
async function links(dir) {
  const resolved = await realpath(dir);
  if (seen.has(resolved)) return;
  seen.add(resolved);
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const item = path.join(dir, e.name);
    if (e.isSymbolicLink()) {
      assert(
        !(await realpath(item)).toLowerCase().startsWith(trash + path.sep),
        'Active dependency link resolves into Trash',
      );
    } else if (e.isDirectory()) await links(item);
  }
}
await links(path.join(backend, 'node_modules'));
await links(path.join(root, 'tests', 'node_modules'));
console.log(
  `Layout/branding audit passed (${checked} source files); active imports and dependency links do not rely on Trash.`,
);
