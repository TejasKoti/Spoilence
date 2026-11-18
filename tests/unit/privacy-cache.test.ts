import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createOpaqueKey,
  DecisionCache,
  MAX_AGE_MS,
  SessionHasher,
  type Clock,
} from '../../backend/packages/privacy-cache/src/index.js';

function harness(capacity = 3) {
  let wall = 1_000_000,
    mono = 0;
  const clock: Clock = { wall: () => wall, monotonic: () => mono };
  const cache = new DecisionCache<number>({ capacity, clock, schedule: false });
  return {
    cache,
    advance: (ms: number) => {
      wall += ms;
      mono += ms;
    },
    wall: (ms: number) => {
      wall += ms;
    },
    mono: (ms: number) => {
      mono += ms;
    },
  };
}
afterEach(() => vi.useRealTimers());
describe('hard 24-hour cache lifecycle', () => {
  it('returns at 23:59:59 and rejects at exactly 24:00:00', () => {
    const h = harness(),
      key = createOpaqueKey();
    h.cache.set(key, 1);
    h.advance(MAX_AGE_MS - 1000);
    expect(h.cache.get(key)).toBe(1);
    h.advance(1000);
    expect(h.cache.get(key)).toBeUndefined();
    expect(h.cache.size).toBe(0);
  });
  it('does not slide creation time on read or same-key write', () => {
    const h = harness(),
      key = createOpaqueKey();
    h.cache.set(key, 1);
    h.advance(MAX_AGE_MS - 1);
    expect(h.cache.get(key)).toBe(1);
    h.cache.set(key, 2);
    h.advance(1);
    expect(h.cache.get(key)).toBeUndefined();
  });
  it('expires after suspend even when monotonic timer pauses', () => {
    const h = harness(),
      key = createOpaqueKey();
    h.cache.set(key, 1);
    h.wall(MAX_AGE_MS);
    h.cache.resume();
    expect(h.cache.size).toBe(0);
  });
  it('discards on resume when sleep and a wall correction conceal elapsed time', () => {
    const h = harness(),
      key = createOpaqueKey();
    h.cache.set(key, 1);
    // A real sleep interval is unknowable if both exposed clocks conceal it.
    h.wall(1000);
    h.cache.resume();
    expect(h.cache.get(key)).toBeUndefined();
  });
  it('rejects clock rollbacks and expiration by monotonic time', () => {
    const h = harness(),
      a = createOpaqueKey();
    h.cache.set(a, 1);
    h.wall(-1);
    expect(h.cache.get(a)).toBeUndefined();
    const b = createOpaqueKey();
    h.cache.set(b, 2);
    h.mono(MAX_AGE_MS);
    expect(h.cache.get(b)).toBeUndefined();
    const c = createOpaqueKey();
    h.cache.set(c, 3);
    h.mono(-1);
    expect(h.cache.get(c)).toBeUndefined();
  });
  it('bounds LRU and clears OFF / Clear Data lifecycle storage', () => {
    const h = harness(2),
      a = createOpaqueKey(),
      b = createOpaqueKey(),
      c = createOpaqueKey();
    h.cache.set(a, 1);
    h.cache.set(b, 2);
    h.cache.get(a);
    h.cache.set(c, 3);
    expect(h.cache.get(b)).toBeUndefined();
    expect(h.cache.size).toBe(2);
    h.cache.clear();
    expect(h.cache.size).toBe(0);
    h.cache.set(a, 1);
    h.cache.dispose();
    h.cache.set(b, 2);
    expect(h.cache.size).toBe(0);
  });
  it('schedules cleanup with no lookup and rejects invalid lifetime bounds', () => {
    vi.useFakeTimers();
    const cache = new DecisionCache<number>({ maxAgeMs: 1000 });
    cache.set(createOpaqueKey(), 1);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(cache.size).toBe(0);
    cache.dispose();
    expect(() => new DecisionCache({ maxAgeMs: MAX_AGE_MS + 1 })).toThrow('Invalid cache limits');
  });
  it('uses session-keyed opaque hashes, resets secrets, and rejects raw cache keys', async () => {
    const a = new SessionHasher(),
      b = new SessionHasher();
    const key = await a.hash('fictional text');
    expect(await a.hash('fictional text')).toBe(key);
    expect(await b.hash('fictional text')).not.toBe(key);
    a.clear();
    expect(await a.hash('fictional text')).not.toBe(key);
    const cache = new DecisionCache<number>({ schedule: false });
    expect(() => cache.set('raw' as ReturnType<typeof createOpaqueKey>, 1)).toThrow(
      'Opaque cache key required',
    );
  });
});
