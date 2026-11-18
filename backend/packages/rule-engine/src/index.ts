import type { DetectionResult, RulePack } from '../../detection-contracts/src/index.js';
import { bundledRules } from '../../rule-packs/src/index.js';

const lookalikes: Record<string, string> = {
  '\u0430': 'a',
  '\u0435': 'e',
  '\u043e': 'o',
  '\u0440': 'p',
  '\u0441': 'c',
  '\u0445': 'x',
  '\u0456': 'i',
  '\u0458': 'j',
  '\u0443': 'y',
  '\u03b1': 'a',
  '\u03bf': 'o',
};
export function normalizeText(input: string): string {
  return input
    .slice(0, 32768)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '')
    .replace(/[аеорсхіјуαο]/g, (c) => lookalikes[c] ?? c)
    .replace(/\bg[\s._-]*t[\s._-]*a[\s._-]*(6|vi)\b/g, 'gta $1')
    .replace(/([a-z])0([a-z])/g, '$1o$2')
    .replace(/([a-z])1([a-z])/g, '$1i$2')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
function phrase(text: string, term: string): boolean {
  return ` ${text} `.includes(` ${term} `);
}
function nearWord(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 5) return false;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}
interface Compiled {
  aliases: string[];
  characters: string[];
  risks: string[];
  safe: string[];
}
const compiled = new WeakMap<RulePack, Compiled>();
function compile(pack: RulePack): Compiled {
  let rules = compiled.get(pack);
  if (!rules) {
    rules = {
      aliases: pack.aliases.map(normalizeText),
      characters: pack.characterAliases.map(normalizeText),
      risks: pack.riskTerms.map(normalizeText),
      safe: pack.safePhrases.map(normalizeText),
    };
    compiled.set(pack, rules);
  }
  return rules;
}
export function classifyText(input: string, pack: RulePack = bundledRules): DetectionResult {
  const text = normalizeText(input),
    rules = compile(pack);
  const result = (
    decision: DetectionResult['decision'],
    confidence: number,
    reason: DetectionResult['reason'],
  ): DetectionResult => ({ decision, confidence, reason, ruleVersion: pack.version });
  if (!text) return result('UNCERTAIN', 0.5, 'empty');
  const topic = rules.aliases.some((t) => phrase(text, t));
  const character = rules.characters.some((t) => phrase(text, t));
  if (!topic && !character) return result('ALLOW', 0, 'no-topic');
  // Safe phrases suppress only their own generic "spoiler" token, never concrete story-risk terms.
  let riskText = text;
  const safe = rules.safe.some((t) => phrase(text, t));
  if (safe) for (const t of rules.safe) riskText = riskText.replaceAll(t, ' ');
  const words = riskText.split(' ');
  const risk = rules.risks.some(
    (t) => phrase(riskText, t) || (!t.includes(' ') && words.some((w) => nearWord(w, t))),
  );
  if (risk) return result('BLOCK', topic ? 0.99 : 0.88, 'topic-risk');
  if (safe && topic) return result('ALLOW', 0.05, 'safe-context');
  return result('UNCERTAIN', topic ? 0.65 : 0.35, 'topic-only');
}
