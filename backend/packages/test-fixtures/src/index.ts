import conformanceData from '../conformance.json';
/** Fictional text only. These are regression fixtures, not representative release evidence. */
export interface TextFixture {
  id: string;
  text: string;
  expected: 'BLOCK' | 'ALLOW' | 'UNCERTAIN';
  contentType: 'title' | 'caption' | 'comment' | 'metadata';
}
export const conformanceFixtures: readonly TextFixture[] = conformanceData as TextFixture[];
// Separate from conformance and training rules. Synthetic variations exercise plumbing only.
export const obviousTextHoldout: readonly TextFixture[] = [
  ['h01', 'Watch GTA 6 finale, a fictional testing scenario', 'title'],
  ['h02', 'Grand Theft Auto VI fictional ending summary', 'caption'],
  ['h03', 'GTA VI fictional betrayal explained', 'comment'],
  ['h04', 'New GTA6 all cutscenes synthetic showcase', 'metadata'],
  ['h05', 'Grand Theft Auto 6 fictional secret mission', 'title'],
  ['h06', 'GTA VI fictional boss fight demo', 'caption'],
  ['h07', 'GTA 6 fictional mission revealed here', 'comment'],
  ['h08', 'GTA6 fictional leaked story overview', 'metadata'],
  ['h09', 'G T A 6 fictional death test case', 'title'],
  ['h10', 'GTA VI fabricated plot twist demonstration', 'caption'],
  ['h11', 'GTA 6 fictional final mission exercise', 'comment'],
  ['h12', 'Grand Theft Auto VI fabricated walkthrough', 'metadata'],
].map(([id, text, contentType]) => ({
  id: id!,
  text: text!,
  contentType: contentType as TextFixture['contentType'],
  expected: 'BLOCK',
}));
export const balancedTextHoldout: readonly TextFixture[] = [
  ...obviousTextHoldout,
  ...[
    ['n01', 'Winter gardening ideas', 'title'],
    ['n02', 'Pasta recipes for beginners', 'caption'],
    ['n03', 'Local train service update', 'comment'],
    ['n04', 'Keyboard configuration guide', 'metadata'],
    ['n05', 'GTA VI spoiler free review of graphics', 'title'],
    ['n06', 'GTA6 no spoilers accessibility settings', 'caption'],
    ['n07', 'Movie ending for a different franchise', 'comment'],
    ['n08', 'A fictional spoiler from an unrelated game', 'metadata'],
    ['n09', 'GPU benchmarks in GTA 6 without spoilers', 'title'],
    ['n10', 'Grand Theft Auto VI no spoilers purchase guide', 'caption'],
    ['n11', 'GTA VI trailer date discussion', 'comment'],
    ['n12', 'Grand Theft Auto 6 controller configuration', 'metadata'],
  ].map(([id, text, contentType]) => ({
    id: id!,
    text: text!,
    contentType: contentType as TextFixture['contentType'],
    expected: 'ALLOW' as const,
  })),
];
export function calculateMetrics(
  fixtures: readonly TextFixture[],
  classify: (text: string) => boolean,
) {
  let truePositive = 0,
    falsePositive = 0,
    trueNegative = 0,
    falseNegative = 0;
  for (const fixture of fixtures) {
    const actual = classify(fixture.text),
      positive = fixture.expected === 'BLOCK';
    if (actual && positive) truePositive++;
    else if (actual) falsePositive++;
    else if (positive) falseNegative++;
    else trueNegative++;
  }
  return {
    samples: fixtures.length,
    truePositive,
    falsePositive,
    trueNegative,
    falseNegative,
    recall: truePositive / Math.max(1, truePositive + falseNegative),
    precision: truePositive / Math.max(1, truePositive + falsePositive),
    falsePositiveRate: falsePositive / Math.max(1, falsePositive + trueNegative),
  };
}
