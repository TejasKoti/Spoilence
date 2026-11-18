// Intentionally independent of the detector bundle: no imports, storage or network.
// It releases only the initial page-wide selector guard if detector initialization fails.
setTimeout(() => {
  const root = document.documentElement;
  if (root && !root.hasAttribute('data-ss-ready')) root.setAttribute('data-ss-ready', 'degraded');
}, 5000);
