import { describe, expect, it } from 'vitest';
import { classifyText } from '../../backend/packages/rule-engine/src/index.js';
import {
  balancedTextHoldout,
  calculateMetrics,
  conformanceFixtures,
  obviousTextHoldout,
} from '../../backend/packages/test-fixtures/src/index.js';

describe('shared behavior contract', () => {
  for (const fixture of conformanceFixtures)
    it(`classifies synthetic fixture ${fixture.id}`, () => {
      // Assertion messages contain IDs and enums only, never the supplied text.
      expect(classifyText(fixture.text).decision).toBe(fixture.expected);
    });
  it('meets regression thresholds on the small synthetic holdouts (not a representative evaluation)', () => {
    const detect = (text: string) => classifyText(text).decision === 'BLOCK';
    expect(calculateMetrics(obviousTextHoldout, detect).recall).toBeGreaterThanOrEqual(0.98);
    expect(calculateMetrics(balancedTextHoldout, detect).precision).toBeGreaterThanOrEqual(0.95);
  });
});
