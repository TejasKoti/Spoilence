// @vitest-environment jsdom
import { test, expect } from 'vitest';
import { collectText, adapters } from '../../backend/browser-extension/src/adapters/index.js';
test('bounded extraction includes card metadata and skips scripts and composition fields', () => {
  const card = document.createElement('ytd-video-renderer');
  card.setAttribute('aria-label', 'Synthetic metadata');
  card.innerHTML =
    '<h2>Visible synthetic title</h2><img alt="Synthetic thumbnail"><script>Excluded script text</script><textarea>Excluded draft</textarea><div contenteditable="true">Excluded composition</div>';
  const text = collectText(card, adapters.youtube);
  expect(text).toContain('Synthetic metadata');
  expect(text).toContain('Visible synthetic title');
  expect(text).toContain('Synthetic thumbnail');
  expect(text).not.toContain('Excluded');
  card.innerHTML =
    '<div contenteditable>Excluded empty editor</div><div contenteditable="plaintext-only">Excluded plaintext editor</div><div role="textbox">Excluded role editor</div>';
  expect(collectText(card, adapters.youtube)).not.toContain('Excluded');
});
test('large cards have a bounded extraction budget', () => {
  const card = document.createElement('ytd-video-renderer');
  card.append(document.createTextNode('Synthetic '.repeat(10000)));
  expect(collectText(card, adapters.youtube).length).toBeLessThanOrEqual(20000);
});
