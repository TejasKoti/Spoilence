/** Providers accept decoded, already-present static images only. Never supply URLs. */
export interface StaticImageInput {
  readonly pixels: ImageData;
  readonly signal: AbortSignal;
}
export interface StaticImageResult {
  readonly text?: string;
  readonly risk?: number;
}
export interface StaticImageProvider {
  analyze(input: StaticImageInput): Promise<StaticImageResult>;
  dispose(): void;
}
export interface QueuedJob {
  cancel(): void;
  result: Promise<StaticImageResult | undefined>;
}
/** One optional provider job at a time, bounded queue, no fetching or model loading. */
export class StaticImageQueue {
  private readonly pending: {
    input: ImageData;
    controller: AbortController;
    resolve: (value: StaticImageResult | undefined) => void;
  }[] = [];
  private active: AbortController | undefined;
  private disposed = false;
  constructor(
    private readonly provider: StaticImageProvider,
    private readonly capacity = 8,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 32)
      throw new Error('Invalid image queue capacity');
  }
  enqueue(input: ImageData): QueuedJob {
    const controller = new AbortController();
    let resolve!: (value: StaticImageResult | undefined) => void;
    const result = new Promise<StaticImageResult | undefined>((r) => {
      resolve = r;
    });
    if (this.disposed || this.pending.length >= this.capacity) {
      controller.abort();
      resolve(undefined);
    } else {
      this.pending.push({ input, controller, resolve });
      void this.drain();
    }
    return {
      cancel: () => {
        controller.abort();
        const index = this.pending.findIndex((job) => job.controller === controller);
        if (index !== -1) this.pending.splice(index, 1);
        resolve(undefined);
      },
      result,
    };
  }
  cancelAll(): void {
    this.active?.abort();
    for (const job of this.pending.splice(0)) {
      job.controller.abort();
      job.resolve(undefined);
    }
  }
  dispose(): void {
    this.disposed = true;
    this.cancelAll();
    this.provider.dispose();
  }
  private async drain(): Promise<void> {
    if (this.active || this.disposed) return;
    const job = this.pending.shift();
    if (!job) return;
    this.active = job.controller;
    try {
      if (job.controller.signal.aborted) job.resolve(undefined);
      else {
        const result = await this.provider.analyze({
          pixels: job.input,
          signal: job.controller.signal,
        });
        job.resolve(job.controller.signal.aborted ? undefined : result);
      }
    } catch {
      job.resolve(undefined);
    } finally {
      this.active = undefined;
      void this.drain();
    }
  }
}
