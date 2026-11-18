import type { Site, Adapter, ConcealmentTargets } from './contracts.js';
export type { Site, Adapter, ConcealmentTargets } from './contracts.js';
import { youtube } from './youtube/index.js';
import { instagram } from './instagram/index.js';
import { tiktok } from './tiktok/index.js';
export const adapters: Record<Site, Adapter> = { youtube, instagram, tiktok };
export function siteForHost(host: string): Site | undefined {
  return (Object.keys(adapters) as Site[]).find(
    (site) => host === `${site}.com` || host.endsWith(`.${site}.com`),
  );
}
interface MaskedAttribute {
  original: string | null;
  replacement: string | null;
}
// Transient restoration state only. Never written to extension/browser storage.
const maskedAttributes = new WeakMap<Element, Map<string, MaskedAttribute>>();
type ExpectedMutation =
  | { type: 'attributes'; attribute: string; oldValue: string | null }
  | { type: 'childList'; added: Node[]; removed: Node[] };
const expectedMutations = new WeakMap<Node, ExpectedMutation[]>();
let tracking = false;
export function enableConcealmentMutationTracking(): void { tracking = true; }
function expectMutation(target: Node, mutation: ExpectedMutation): void {
  if (!tracking || !target.isConnected) return;
  if (mutation.type === 'attributes' && !['title', 'aria-label', 'alt', 'aria-labelledby', 'aria-describedby'].includes(mutation.attribute)) return;
  const expected = expectedMutations.get(target) ?? [];
  expected.push(mutation);
  expectedMutations.set(target, expected);
}
export function expectSourceChildMutation(target: Node, added: Node[], removed: Node[]): void {
  expectMutation(target, { type: 'childList', added, removed });
}
export function isConcealmentMutation(record: MutationRecord): boolean {
  const expected = expectedMutations.get(record.target);
  if (!expected) return false;
  const equal = (actual: NodeList, nodes: Node[]) => actual.length === nodes.length && nodes.every((node, index) => actual[index] === node);
  const index = expected.findIndex((entry) => entry.type === record.type && (
    entry.type === 'attributes'
      ? record.attributeName === entry.attribute && record.oldValue === entry.oldValue
      : equal(record.addedNodes, entry.added) && equal(record.removedNodes, entry.removed)
  ));
  if (index < 0) return false;
  expected.splice(index, 1);
  if (!expected.length) expectedMutations.delete(record.target);
  return true;
}
export function sourceAttribute(node: Element, attribute: string): string | null {
  const current = node.getAttribute(attribute);
  const saved = maskedAttributes.get(node)?.get(attribute);
  if (!saved) return current;
  if (current !== saved.replacement) saved.original = current;
  return saved.original;
}
export function maskAttribute(node: Element, attribute: string, replacement: string | null): void {
  let attributes = maskedAttributes.get(node);
  if (!attributes) maskedAttributes.set(node, (attributes = new Map()));
  const previous = attributes.get(attribute);
  const current = node.getAttribute(attribute);
  const original = previous && current === previous.replacement ? previous.original : current;
  attributes.set(attribute, { original, replacement });
  if (current === replacement) return;
  expectMutation(node, { type: 'attributes', attribute, oldValue: current });
  if (replacement === null) node.removeAttribute(attribute);
  else node.setAttribute(attribute, replacement);
}
export function restoreAttributes(node: Element): void {
  const attributes = maskedAttributes.get(node);
  if (!attributes) return;
  for (const [attribute, saved] of attributes) {
    if (node.getAttribute(attribute) !== saved.replacement) continue;
    if (saved.original === saved.replacement) continue;
    expectMutation(node, { type: 'attributes', attribute, oldValue: saved.replacement });
    if (saved.original === null) node.removeAttribute(attribute);
    else node.setAttribute(attribute, saved.original);
  }
  maskedAttributes.delete(node);
}
export function concealmentTargets(card: HTMLElement, explicit?: Adapter): ConcealmentTargets {
  const site = siteForHost(card.ownerDocument.location.hostname);
  const adapter = explicit ?? (site ? adapters[site] : Object.values(adapters).find((entry) => card.matches(entry.selector)));
  if (!adapter) return { titles: [], thumbnails: [], metadata: [] };
  const excluded = '[data-ss-owned],[data-ss-original-title],script,style,textarea,input,[contenteditable]:not([contenteditable="false" i])';
  const preserve = `${adapter.concealment.preserve},.yt-content-metadata-view-model__metadata-row,.yt-content-metadata-view-model__metadata-text,[class*="duration"],[class*="avatar"],[data-e2e*="author"],[data-e2e*="view-count"],a[href^="/@"],a[href^="/channel/"],a[href^="/user/"],a[href^="/c/"],time`;
  const select = (selector: string) =>
    [
      ...(card.matches(selector) ? [card] : []),
      ...card.querySelectorAll<HTMLElement>(selector),
    ].filter((node) => !node.closest(excluded) && !node.closest(preserve));
  const titles = select(adapter.concealment.titles);
  const primary = titles.filter((node) => !titles.some((other) => other !== node && node.contains(other)));
  // Unknown captions get individual source-preserving text replacements. Never
  // cover an entire result simply because a site introduced another text block.
  const walker = card.ownerDocument.createTreeWalker(card, 4);
  let node: Node | null;
  let visited = 0;
  const additional: Text[] = [];
  while ((node = walker.nextNode())) {
    if (++visited > 512) break;
    if (!node.nodeValue?.trim()) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest(`${excluded},${preserve},button,[role="button"],[role="tooltip"],tp-yt-paper-tooltip,yt-tooltip`)) continue;
    if (primary.some((title) => title.contains(parent))) continue;
    const text = node.nodeValue.trim();
    // Duration and numeric engagement labels remain intact on unfamiliar markup.
    if (/^(?:\d{1,2}:){1,2}\d{2}$/.test(text) || /^\d[\d.,\s]*[kmb]?\s*(?:views?|watching|likes?)\b/i.test(text) || /^(?:streamed\s+|premiered\s+)?\d+\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago$/i.test(text)) continue;
    additional.push(node as Text);
  }
  const granular = additional.map((text) => {
    const parent = text.parentNode!;
    const wrapper = card.ownerDocument.createElement('span');
    wrapper.dataset.ssTextTarget = 'true';
    expectSourceChildMutation(parent, [wrapper], []);
    parent.insertBefore(wrapper, text);
    expectSourceChildMutation(parent, [], [text]);
    expectSourceChildMutation(wrapper, [text], []);
    wrapper.append(text);
    return wrapper;
  });
  return {
    // Prefer an actual nested title link over its surrounding heading.
    titles: [...primary, ...granular, ...select('[data-ss-text-target]')].filter((value, index, all) => all.indexOf(value) === index),
    thumbnails: select(adapter.concealment.thumbnails),
    metadata: select('[title],[aria-label],[alt],[aria-labelledby],[aria-describedby]'),
  };
}
export function collectText(card: HTMLElement, adapter: Adapter): string {
  // Bound extraction itself, rather than allocating a whole subtree's text first.
  // Composition fields and executable/extension-owned subtrees are never inspected.
  const excluded =
    '[data-ss-owned],script,style,noscript,textarea,input,[role="textbox"],[role="searchbox"],[contenteditable]:not([contenteditable="false" i])';
  if (card.matches(excluded)) return '';
  const parts: string[] = [];
  let remaining = 20000;
  const append = (text: string) => {
    const part = text.slice(0, remaining);
    parts.push(part);
    remaining -= part.length + 1;
  };
  function metadata(node: Element) {
    for (const attribute of ['title', 'aria-label', 'alt']) {
      const value = sourceAttribute(node, attribute);
      if (value && remaining > 0) append(value.slice(0, 1000));
    }
  }
  metadata(card);
  const walker = card.ownerDocument.createTreeWalker(card, 1 | 4, {
    acceptNode: (node) => (node.nodeType === 1 && (node as Element).matches(excluded) ? 2 : 1),
  });
  let node: Node | null,
    visited = 0;
  while (remaining > 0 && visited++ < 512 && (node = walker.nextNode())) {
    if (node.nodeType === 3) append(node.nodeValue ?? '');
    else if ((node as Element).matches(adapter.metadata)) metadata(node as Element);
  }
  return parts.join(' ').slice(0, 20000);
}
