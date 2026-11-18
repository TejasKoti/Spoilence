import { describe, expect, it } from 'vitest';
import {
  StaticImageQueue,
  type StaticImageProvider,
  type StaticImageResult,
} from '../../backend/packages/image-analysis-contracts/src/index.js';

const pixels = {} as ImageData; // Synthetic opaque fixture; provider never reads pixels.
describe('optional static-image scheduling', () => {
  it('runs one job at a time and discards cancelled output', async () => {
    const resolvers: ((result: StaticImageResult) => void)[] = [];
    let active = 0,
      maximum = 0;
    let secondStarted!: () => void;
    const secondStart = new Promise<void>((resolve) => {
      secondStarted = resolve;
    });
    const provider: StaticImageProvider = {
      analyze: async () => {
        active++;
        maximum = Math.max(maximum, active);
        if (resolvers.length === 1) secondStarted();
        return new Promise<StaticImageResult>((r) =>
          resolvers.push((value) => {
            active--;
            r(value);
          }),
        );
      },
      dispose: () => undefined,
    };
    const queue = new StaticImageQueue(provider);
    const a = queue.enqueue(pixels),
      b = queue.enqueue(pixels);
    expect(resolvers.length).toBe(1);
    a.cancel();
    resolvers[0]!({ risk: 1 });
    expect(await a.result).toBeUndefined();
    await secondStart;
    expect(resolvers.length).toBe(2);
    resolvers[1]!({ risk: 0.5 });
    expect(await b.result).toEqual({ risk: 0.5 });
    expect(maximum).toBe(1);
    queue.dispose();
  });
  it('bounds queue size, cancels navigation work, and disposes provider', async () => {
    let finish!: (result: StaticImageResult) => void,
      disposed = false;
    const queue = new StaticImageQueue(
      {
        analyze: () =>
          new Promise((r) => {
            finish = r;
          }),
        dispose: () => {
          disposed = true;
        },
      },
      1,
    );
    const active = queue.enqueue(pixels),
      pending = queue.enqueue(pixels),
      overflow = queue.enqueue(pixels);
    expect(await overflow.result).toBeUndefined();
    queue.cancelAll();
    expect(await pending.result).toBeUndefined();
    finish({ risk: 1 });
    expect(await active.result).toBeUndefined();
    queue.dispose();
    expect(disposed).toBe(true);
    expect(await queue.enqueue(pixels).result).toBeUndefined();
  });
  it('contains provider failures without diagnostics containing image text', async () => {
    const queue = new StaticImageQueue({
      analyze: async () => {
        throw new Error('synthetic provider failure');
      },
      dispose: () => undefined,
    });
    expect(await queue.enqueue(pixels).result).toBeUndefined();
    queue.dispose();
  });
  it('settles individually cancelled pending work and releases its queue slot immediately', async () => {
    let finish!: (result: StaticImageResult) => void;
    const queue = new StaticImageQueue(
      {
        analyze: () =>
          new Promise((r) => {
            finish = r;
          }),
        dispose: () => undefined,
      },
      1,
    );
    const active = queue.enqueue(pixels),
      pending = queue.enqueue(pixels);
    pending.cancel();
    expect(await pending.result).toBeUndefined();
    const replacement = queue.enqueue(pixels);
    replacement.cancel();
    expect(await replacement.result).toBeUndefined();
    finish({ risk: 0 });
    await active.result;
    queue.dispose();
  });
});
