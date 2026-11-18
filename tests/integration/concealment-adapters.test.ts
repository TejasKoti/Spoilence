// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';
import { CensorController, PROTECTED_TITLE } from '../../backend/browser-extension/src/content/censor.js';
import { adapters, collectText } from '../../backend/browser-extension/src/adapters/index.js';

afterEach(() => document.body.replaceChildren());
for (const [site, body, caption, metadata] of [
  ['instagram', '<header><img id="avatar" alt="Author profile picture"><span>Calm Author</span></header><img id="media" alt="GTA VI synthetic scene"><h1 id="caption">GTA VI fictional ending</h1><time>2 hours ago</time><span data-testid="view-count">82K views</span>', '#caption', ['header', 'time', '[data-testid="view-count"]']],
  ['tiktok', '<header><img id="avatar" alt="Author profile picture"><a data-e2e="video-author-uniqueid">Calm Author</a></header><img id="media" alt="GTA VI synthetic scene"><div data-e2e="video-desc">GTA VI fictional ending</div><span data-e2e="video-duration">00:42</span><span data-e2e="video-views">82K views</span>', '[data-e2e="video-desc"]', ['header', '[data-e2e="video-duration"]', '[data-e2e="video-views"]']],
] as const) {
  test(`${site} Blur preserves author/duration/views and filters only the content thumbnail`, () => {
    const card = document.createElement(site === 'instagram' ? 'article' : 'div');
    if (site === 'tiktok') card.dataset.e2e = 'recommend-list-item-container';
    card.innerHTML = body;
    document.body.append(card);
    const before = metadata.map((selector) => card.querySelector(selector)!.textContent);
    const controller = new CensorController(adapters[site]);
    controller.conceal(card, 'blur', () => {});
    expect(card.style.visibility).toBe('');
    expect(card.querySelector<HTMLElement>('#media')!.style.filter).toBe('blur(32px)');
    expect(card.querySelector<HTMLElement>('#avatar')!.style.filter).toBe('');
    expect(card.querySelector(`${caption} [data-ss-replacement-title]`)?.textContent).toBe(PROTECTED_TITLE);
    expect(metadata.map((selector) => card.querySelector(selector)!.textContent)).toEqual(before);
    expect(collectText(card, adapters[site])).toContain('GTA VI fictional ending');
    controller.restore(card);
    expect(card.querySelector(caption)?.textContent).toBe('GTA VI fictional ending');
    expect(card.querySelector<HTMLImageElement>('#media')!.alt).toBe('GTA VI synthetic scene');
    expect(card.querySelector<HTMLElement>('#media')!.style.filter).toBe('');
  });
}
