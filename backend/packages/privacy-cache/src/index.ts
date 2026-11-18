/** Detection data never leaves this bounded in-memory store. */
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;
export type OpaqueKey = string & { readonly __opaqueKey: unique symbol };
export interface Clock {
  wall(): number;
  monotonic(): number;
}
const defaultClock: Clock = { wall: () => Date.now(), monotonic: () => performance.now() };
export function createOpaqueKey(): OpaqueKey {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `ss_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}` as OpaqueKey;
}
export class SessionHasher {
  private key: Promise<CryptoKey> | undefined;
  async hash(text: string): Promise<OpaqueKey> {
    this.key ??= crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = new Uint8Array(
      await crypto.subtle.sign('HMAC', await this.key, new TextEncoder().encode(text)),
    );
    return `ss_${Array.from(signature.subarray(0, 16), (b) => b.toString(16).padStart(2, '0')).join('')}` as OpaqueKey;
  }
  clear(): void {
    this.key = undefined;
  }
}
interface Entry<T> {
  value: T;
  createdWall: number;
  createdMono: number;
}
export interface CacheOptions {
  capacity?: number;
  maxAgeMs?: number;
  clock?: Clock;
  /** False only for deterministic tests. Normal operation schedules one expiry timer. */
  schedule?: boolean;
}
export class DecisionCache<T> {
  private readonly entries = new Map<OpaqueKey, Entry<T>>();
  private readonly capacity: number;
  private readonly maxAgeMs: number;
  private readonly clock: Clock;
  private readonly schedule: boolean;
  private lastWall = -Infinity;
  private lastMono = -Infinity;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;
  constructor(options: CacheOptions = {}) {
    this.capacity = options.capacity ?? 500;
    this.maxAgeMs = options.maxAgeMs ?? MAX_AGE_MS;
    this.clock = options.clock ?? defaultClock;
    this.schedule = options.schedule ?? true;
    if (
      !Number.isInteger(this.capacity) ||
      this.capacity < 1 ||
      this.capacity > 10000 ||
      !Number.isFinite(this.maxAgeMs) ||
      this.maxAgeMs <= 0 ||
      this.maxAgeMs > MAX_AGE_MS
    )
      throw new Error('Invalid cache limits');
    this.sweep();
  }
  private now(): { wall: number; mono: number } {
    const wall = this.clock.wall(),
      mono = this.clock.monotonic();
    // Discard on clock rollback instead of risking retention beyond the maximum age.
    if (
      !Number.isFinite(wall) ||
      !Number.isFinite(mono) ||
      wall < this.lastWall ||
      mono < this.lastMono
    )
      this.entries.clear();
    this.lastWall = wall;
    this.lastMono = mono;
    return { wall, mono };
  }
  private expired(entry: Entry<T>, now: { wall: number; mono: number }): boolean {
    return (
      !Number.isFinite(now.wall) ||
      !Number.isFinite(now.mono) ||
      now.wall - entry.createdWall >= this.maxAgeMs ||
      now.mono - entry.createdMono >= this.maxAgeMs
    );
  }
  get(key: OpaqueKey): T | undefined {
    const now = this.now(),
      entry = this.entries.get(key);
    if (!entry) return undefined;
    if (this.expired(entry, now)) {
      this.entries.delete(key);
      this.arm();
      return undefined;
    }
    // Updating LRU order never changes either creation timestamp.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }
  set(key: OpaqueKey, value: T): void {
    if (this.disposed) return;
    if (!/^ss_[a-f0-9]{32}$/.test(key)) throw new Error('Opaque cache key required');
    const now = this.now();
    if (!Number.isFinite(now.wall) || !Number.isFinite(now.mono)) return;
    // Same-key writes cannot slide the lifetime of an existing classification.
    const existing = this.entries.get(key);
    if (existing && !this.expired(existing, now)) {
      existing.value = value;
      this.entries.delete(key);
      this.entries.set(key, existing);
    } else {
      this.entries.delete(key);
      this.entries.set(key, { value, createdWall: now.wall, createdMono: now.mono });
    }
    while (this.entries.size > this.capacity)
      this.entries.delete(this.entries.keys().next().value!);
    this.arm();
  }
  sweep(): void {
    const now = this.now();
    for (const [key, entry] of this.entries) if (this.expired(entry, now)) this.entries.delete(key);
    this.arm();
  }
  /**
   * Call after visibility/app resume. Browsers disagree about monotonic clocks
   * advancing during OS sleep; a wall-clock correction can hide that interval.
   * Discarding on resume is the conservative way to avoid retaining old results.
   */
  resume(): void {
    this.clear();
    this.sweep();
  }
  clear(): void {
    this.entries.clear();
    this.cancelTimer();
  }
  dispose(): void {
    this.clear();
    this.disposed = true;
  }
  get size(): number {
    this.sweep();
    return this.entries.size;
  }
  private cancelTimer(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }
  private arm(): void {
    this.cancelTimer();
    if (!this.schedule || this.disposed || !this.entries.size) return;
    let delay = this.maxAgeMs;
    for (const entry of this.entries.values())
      delay = Math.min(
        delay,
        this.maxAgeMs -
          Math.max(this.lastWall - entry.createdWall, this.lastMono - entry.createdMono),
      );
    this.timer = setTimeout(() => this.sweep(), Math.max(1, delay));
    // Node benchmarking must not be kept alive by a browser lifecycle timer.
    (this.timer as unknown as { unref?: () => void }).unref?.();
  }
}
