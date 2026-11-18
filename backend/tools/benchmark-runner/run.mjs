import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
await mkdir('../tests/results', { recursive: true });
await mkdir('build/benchmarks', { recursive: true });
await build({
  entryPoints: ['tools/benchmark-runner/entry.ts'],
  outfile: 'build/benchmarks/benchmark.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
});
const {
  classifyText,
  DecisionCache,
  createOpaqueKey,
  calculateMetrics,
  obviousTextHoldout,
  balancedTextHoldout,
  shouldConceal,
  DEFAULT_SETTINGS,
} = await import('../../build/benchmarks/benchmark.mjs');
const p95 = (values) => values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)];
const text = 'GTA VI fictional finale testing sample '.repeat(10);
for (let i = 0; i < 2000; i++) classifyText(text);
const rules = [];
for (let i = 0; i < 20000; i++) {
  const t = performance.now();
  classifyText(text);
  rules.push(performance.now() - t);
}
const cache = new DecisionCache({ schedule: false }),
  key = createOpaqueKey();
cache.set(key, classifyText(text));
const lookup = [];
for (let i = 0; i < 20000; i++) {
  const t = performance.now();
  cache.get(key);
  lookup.push(performance.now() - t);
}
cache.dispose();
const detection = {};
for (const sensitivity of ['aggressive', 'balanced']) {
  const classify = (text) =>
    shouldConceal(classifyText(text), { ...DEFAULT_SETTINGS, sensitivity });
  detection[sensitivity] = {
    obvious: calculateMetrics(obviousTextHoldout, classify),
    balanced: calculateMetrics(balancedTextHoldout, classify),
    byContentType: Object.fromEntries(
      ['title', 'caption', 'comment', 'metadata'].map((type) => [
        type,
        calculateMetrics(
          balancedTextHoldout.filter((f) => f.contentType === type),
          classify,
        ),
      ]),
    ),
  };
}
const result = {
  date: new Date().toISOString(),
  environment: {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length,
    totalMemoryGB: Math.round(os.totalmem() / 2 ** 30),
  },
  workload: {
    synthetic: true,
    representative: false,
    iterations: 20000,
    cardCharacters: text.length,
  },
  rulesP95Ms: p95(rules),
  cacheP95Ms: p95(lookup),
  detection,
  limitations: [
    'Host not designated low-end hardware',
    'Synthetic fixtures do not establish representative precision/recall',
    'Native platforms require their own runtime/device measurement',
  ],
};
await writeFile('../tests/results/benchmark.json', JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    rulesP95Ms: result.rulesP95Ms,
    cacheP95Ms: result.cacheP95Ms,
    syntheticOnly: true,
  }),
);
if (result.rulesP95Ms >= 10 || result.cacheP95Ms >= 2) process.exitCode = 1;
