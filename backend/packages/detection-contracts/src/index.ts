/** Language-neutral v1 contracts. Reasons contain no user text. */
export type Decision = 'BLOCK' | 'ALLOW' | 'UNCERTAIN';
export type DecisionReason = 'topic-risk' | 'topic-only' | 'no-topic' | 'empty' | 'safe-context';
export interface DetectionResult {
  readonly decision: Decision;
  /** Estimated risk score, not a calibrated probability. */
  readonly confidence: number;
  readonly reason: DecisionReason;
  readonly ruleVersion: string;
}
export interface RulePack {
  readonly schemaVersion: 1;
  readonly topic: 'gta-vi';
  readonly version: string;
  readonly aliases: readonly string[];
  readonly characterAliases: readonly string[];
  readonly riskTerms: readonly string[];
  readonly safePhrases: readonly string[];
}
export interface PlatformCapabilities {
  readonly earlyConcealment: boolean;
  readonly accessibleText: boolean;
  readonly staticImageOcr: boolean;
  readonly nativeAppFiltering: boolean;
}
export const CONTRACT_VERSION = 1;
