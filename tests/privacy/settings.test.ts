import { test, expect } from 'vitest';
import { parseSettings } from '../../backend/packages/settings-schema/src/index.js';
test('prototype property names cannot bypass persisted-settings allowlist', () => {
  for (const key of ['constructor', 'toString', '__proto__'])
    expect(() => parseSettings(JSON.parse(`{"${key}":"synthetic rejected content"}`))).toThrow(
      'Invalid settings',
    );
});
