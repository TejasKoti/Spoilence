import type { DetectionResult } from '../../detection-contracts/src/index.js';
import type { Settings } from '../../settings-schema/src/index.js';
export function shouldConceal(result: DetectionResult, settings: Settings): boolean {
  if (!settings.enabled) return false;
  if (settings.sensitivity === 'custom')
    return result.decision !== 'ALLOW' && result.confidence >= settings.customThreshold;
  return (
    result.decision === 'BLOCK' ||
    (settings.sensitivity === 'aggressive' && result.decision === 'UNCERTAIN')
  );
}
