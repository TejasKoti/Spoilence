import { api } from '../platform.js';
// No content or decisions live in the worker. Revocation invalidates every open page conservatively.
api?.permissions?.onRemoved?.addListener(() => {
  void (async () => {
    try {
      const tabs = await api?.tabs?.query({});
      await Promise.allSettled(
        (tabs ?? [])
          .filter((tab) => tab.id !== undefined)
          .map((tab) => api?.tabs?.sendMessage(tab.id!, { type: 'shield-permission-revoked' })),
      );
    } catch {
      /* Browser may tear down receivers concurrently; no diagnostic content. */
    }
  })();
});
