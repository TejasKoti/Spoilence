import { test, expect, vi } from 'vitest';
test('permission revocation relays only a safe invalidation message and tolerates missing receivers', async () => {
  let listener: (() => void) | undefined;
  const sendMessage = vi
    .fn()
    .mockResolvedValueOnce({ cleared: true })
    .mockRejectedValueOnce(new Error('Synthetic missing receiver'));
  vi.stubGlobal('browser', undefined);
  vi.stubGlobal('chrome', {
    permissions: {
      onRemoved: {
        addListener: (callback: () => void) => {
          listener = callback;
        },
      },
    },
    tabs: { query: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, {}]), sendMessage },
  });
  await import('../../backend/browser-extension/src/background/index.js');
  listener?.();
  await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));
  expect(sendMessage).toHaveBeenCalledWith(1, { type: 'shield-permission-revoked' });
  expect(sendMessage).toHaveBeenCalledWith(2, { type: 'shield-permission-revoked' });
  vi.unstubAllGlobals();
});
