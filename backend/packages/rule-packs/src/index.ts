import data from './gta-vi.json';
import type { RulePack } from '../../detection-contracts/src/index.js';
export const bundledRules: RulePack = Object.freeze({
  ...data,
  schemaVersion: 1,
  topic: 'gta-vi',
  aliases: Object.freeze(data.aliases),
  characterAliases: Object.freeze(data.characterAliases),
  riskTerms: Object.freeze(data.riskTerms),
  safePhrases: Object.freeze(data.safePhrases),
});
