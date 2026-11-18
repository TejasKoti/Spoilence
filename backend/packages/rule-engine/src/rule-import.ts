import type { RulePack } from '../../detection-contracts/src/index.js';

const keys = [
  'schemaVersion',
  'topic',
  'version',
  'aliases',
  'characterAliases',
  'riskTerms',
  'safePhrases',
];
export function validateRulePack(input: unknown): RulePack {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    throw new Error('Invalid rule pack');
  const p = input as Record<string, unknown>;
  if (
    Object.keys(p).length !== keys.length ||
    Object.keys(p).some((k) => !keys.includes(k)) ||
    p.schemaVersion !== 1 ||
    p.topic !== 'gta-vi' ||
    typeof p.version !== 'string' ||
    !/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(p.version)
  )
    throw new Error('Invalid rule pack');
  for (const key of ['aliases', 'characterAliases', 'riskTerms', 'safePhrases']) {
    const list = p[key];
    if (
      !Array.isArray(list) ||
      !list.length ||
      list.length > 256 ||
      list.some(
        (v) =>
          typeof v !== 'string' || !v.trim() || v.length > 100 || /[\u0000-\u001f\u007f]/.test(v),
      ) ||
      new Set(list).size !== list.length
    )
      throw new Error('Invalid rule pack');
  }
  const pack = p as unknown as RulePack;
  return Object.freeze({
    ...pack,
    aliases: Object.freeze([...pack.aliases]),
    characterAliases: Object.freeze([...pack.characterAliases]),
    riskTerms: Object.freeze([...pack.riskTerms]),
    safePhrases: Object.freeze([...pack.safePhrases]),
  });
}
/** Digest is supplied independently by the user; a matching digest is integrity, not publisher authenticity. */
export async function verifyRuleImport(text: string, expectedSha256: string): Promise<RulePack> {
  if (text.length > 128 * 1024 || !/^[a-fA-F0-9]{64}$/.test(expectedSha256))
    throw new Error('Invalid rule import');
  const bytes = new TextEncoder().encode(text);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const actual = Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
  if (actual !== expectedSha256.toLowerCase()) throw new Error('Rule integrity mismatch');
  try {
    return validateRulePack(JSON.parse(text) as unknown);
  } catch {
    throw new Error('Invalid rule pack');
  }
}
