export interface Settings {
  schemaVersion: 1;
  enabled: boolean;
  mode: 'hide' | 'blur';
  sensitivity: 'aggressive' | 'balanced' | 'custom';
  customThreshold: number;
  sites: { youtube: boolean; instagram: boolean; tiktok: boolean };
  lowPower: boolean;
  staticImageAnalysis: boolean;
}
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  schemaVersion: 1,
  enabled: true,
  mode: 'blur',
  sensitivity: 'aggressive',
  customThreshold: 0.65,
  sites: Object.freeze({ youtube: true, instagram: true, tiktok: true }),
  lowPower: true,
  staticImageAnalysis: false,
});
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Unknown fields are rejected so content accidentally passed here cannot reach storage. */
export function parseSettings(value: unknown): Settings {
  if (!object(value) || Object.keys(value).some((k) => !Object.hasOwn(DEFAULT_SETTINGS, k)))
    throw new Error('Invalid settings');
  const parsed = { ...DEFAULT_SETTINGS, ...value, sites: { ...DEFAULT_SETTINGS.sites } };
  if (value.sites !== undefined) {
    if (
      !object(value.sites) ||
      Object.keys(value.sites).some((k) => !['youtube', 'instagram', 'tiktok'].includes(k))
    )
      throw new Error('Invalid settings');
    parsed.sites = { ...parsed.sites, ...value.sites } as Settings['sites'];
  }
  if (
    parsed.schemaVersion !== 1 ||
    typeof parsed.enabled !== 'boolean' ||
    !['hide', 'blur'].includes(parsed.mode as string) ||
    !['aggressive', 'balanced', 'custom'].includes(parsed.sensitivity as string) ||
    typeof parsed.customThreshold !== 'number' ||
    !Number.isFinite(parsed.customThreshold) ||
    parsed.customThreshold < 0 ||
    parsed.customThreshold > 1 ||
    typeof parsed.lowPower !== 'boolean' ||
    typeof parsed.staticImageAnalysis !== 'boolean' ||
    Object.values(parsed.sites).some((v) => typeof v !== 'boolean')
  )
    throw new Error('Invalid settings');
  return parsed as Settings;
}
