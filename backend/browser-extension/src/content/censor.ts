import {
  concealmentTargets,
  maskAttribute,
  restoreAttributes,
  sourceAttribute,
  expectSourceChildMutation,
  type Adapter,
  type ConcealmentTargets,
} from '../adapters/index.js';

export type Mode = 'hide' | 'blur';
export const PROTECTED_TITLE = 'Spoilence Protected - GTA 6 Leak';
interface StyleValue {
  value: string;
  priority: string;
}
interface StyleState {
  original: StyleValue;
  applied: StyleValue;
  requested: string;
}
interface TitleState {
  original: HTMLElement;
  replacement: HTMLElement;
}
interface Saved {
  mode: Mode;
  styles: Map<HTMLElement, Map<string, StyleState>>;
  hadStyle: Map<HTMLElement, boolean>;
  inert: Map<HTMLElement, boolean>;
  attributes: Set<HTMLElement>;
  titles: Map<HTMLElement, TitleState>;
  media: Set<HTMLElement>;
  host?: HTMLElement;
  hostParent?: HTMLElement;
  anchor?: HTMLElement;
  observer?: ResizeObserver;
  resize?: () => void;
  onReveal: () => void;
}

export class CensorController {
  private saved = new WeakMap<HTMLElement, Saved>();
  constructor(private adapter?: Adapter) {}

  private style(state: Saved, node: HTMLElement, name: string, value: string) {
    let values = state.styles.get(node);
    if (!values) {
      state.styles.set(node, (values = new Map()));
      state.hadStyle.set(node, node.hasAttribute('style'));
    }
    const current = {
      value: node.style.getPropertyValue(name),
      priority: node.style.getPropertyPriority(name),
    };
    const previous = values.get(name);
    if (
      previous &&
      previous.requested === value &&
      current.value === previous.applied.value &&
      current.priority === previous.applied.priority
    )
      return;
    const original =
      previous &&
      current.value === previous.applied.value &&
      current.priority === previous.applied.priority
        ? previous.original
        : current;
    if (current.value !== value || current.priority !== 'important')
      node.style.setProperty(name, value, 'important');
    values.set(name, {
      original,
      requested: value,
      applied: {
        value: node.style.getPropertyValue(name),
        priority: node.style.getPropertyPriority(name),
      },
    });
  }
  private restoreStyles(state: Saved, node: HTMLElement) {
    for (const [name, saved] of state.styles.get(node) ?? []) {
      if (
        node.style.getPropertyValue(name) !== saved.applied.value ||
        node.style.getPropertyPriority(name) !== saved.applied.priority
      )
        continue;
      if (saved.original.value)
        node.style.setProperty(name, saved.original.value, saved.original.priority);
      else node.style.removeProperty(name);
    }
    if (!state.hadStyle.get(node) && !node.style.cssText) node.removeAttribute('style');
    state.styles.delete(node);
    state.hadStyle.delete(node);
  }
  private inert(state: Saved, node: HTMLElement) {
    if (!state.inert.has(node)) state.inert.set(node, !!node.inert);
    node.inert = true;
  }
  private restoreInert(state: Saved, node: HTMLElement) {
    const original = state.inert.get(node);
    if (original !== undefined) node.inert = original;
    state.inert.delete(node);
  }
  private metadata(state: Saved, node: HTMLElement, thumbnail = false) {
    state.attributes.add(node);
    for (const attribute of ['title', 'aria-label'])
      if (sourceAttribute(node, attribute) !== null)
        maskAttribute(
          node,
          attribute,
          thumbnail ? 'Spoilence protected thumbnail' : PROTECTED_TITLE,
        );
    // An external accessible-name reference must not override the safe title.
    for (const attribute of ['aria-labelledby', 'aria-describedby'])
      if (sourceAttribute(node, attribute) !== null) maskAttribute(node, attribute, null);
    if (thumbnail) {
      maskAttribute(node, 'aria-label', 'Spoilence protected thumbnail');
      if (node.tagName === 'IMG') maskAttribute(node, 'alt', 'Spoilence protected thumbnail');
    }
  }
  private releaseTitle(node: HTMLElement, saved: TitleState) {
    // Only extension-created wrappers are unwrapped. Never reinstate an old title
    // over replacement children supplied by a recycling feed.
    const parent = saved.original.parentNode;
    if (parent) {
      for (const child of Array.from(saved.original.childNodes)) {
        expectSourceChildMutation(saved.original, [], [child]);
        expectSourceChildMutation(parent, [child], []);
        parent.insertBefore(child, saved.original);
      }
      expectSourceChildMutation(parent, [], [saved.original]);
      saved.original.remove();
    }
    saved.replacement.remove();
    delete node.dataset.ssTitle;
    if (node.hasAttribute('data-ss-text-target') && node.parentNode) {
      const parent = node.parentNode;
      for (const child of Array.from(node.childNodes)) {
        expectSourceChildMutation(node, [], [child]);
        expectSourceChildMutation(parent, [child], []);
        parent.insertBefore(child, node);
      }
      expectSourceChildMutation(parent, [], [node]);
      node.remove();
    }
  }
  private title(state: Saved, node: HTMLElement) {
    let saved = state.titles.get(node);
    if (
      saved &&
      (saved.original.parentElement !== node || saved.replacement.parentElement !== node)
    ) {
      this.releaseTitle(node, saved);
      state.titles.delete(node);
      saved = undefined;
    }
    if (!saved) {
      const original = document.createElement('span');
      original.dataset.ssOriginalTitle = 'true';
      original.hidden = true;
      original.inert = true;
      original.setAttribute('aria-hidden', 'true');
      original.style.setProperty('display', 'none', 'important');
      const replacement = document.createElement('span');
      replacement.dataset.ssOwned = 'true';
      replacement.dataset.ssReplacementTitle = 'true';
      replacement.textContent = PROTECTED_TITLE;
      saved = { original, replacement };
      state.titles.set(node, saved);
    }
    for (const child of Array.from(node.childNodes))
      if (
        child !== saved.original &&
        child !== saved.replacement &&
        !(child instanceof Element && child.hasAttribute('data-ss-owned'))
      ) {
        expectSourceChildMutation(node, [], [child]);
        expectSourceChildMutation(saved.original, [child], []);
        saved.original.append(child);
      }
    if (saved.original.parentElement !== node) {
      expectSourceChildMutation(node, [saved.original], []);
      node.append(saved.original);
    }
    if (saved.replacement.parentElement !== node) node.append(saved.replacement);
    node.dataset.ssTitle = 'protected';
    this.metadata(state, node);
  }
  private reveal(
    card: HTMLElement,
    state: Saved,
    parent: HTMLElement,
    inline = false,
  ) {
    const host = document.createElement('span');
    host.dataset.ssOwned = 'true';
    host.dataset.ssReveal = 'true';
    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = inline
        ? ':host{visibility:visible!important;display:inline-block!important;position:relative!important;margin-left:8px!important;font:12px system-ui!important}'
        : ':host{visibility:visible!important;display:flex!important;position:absolute!important;z-index:2147483646!important;align-items:center!important;justify-content:center!important;pointer-events:auto!important;background:transparent!important;font:12px system-ui!important}';
    style.textContent +=
      'button{pointer-events:auto;background:#171923;color:#fff;border:1px solid #fdba74;border-radius:7px;min-height:71px;padding:15px 24px;cursor:pointer;font:22.5px system-ui}button:focus-visible{outline:3px solid #fdba74;outline-offset:3px}';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Reveal Content';
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend'])
      button.addEventListener(type, (event) => event.stopPropagation());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      // Keep the button mounted until the browser finishes dispatching the click.
      queueMicrotask(() => {
        state.onReveal();
        this.restore(card);
      });
    });
    if (!inline) {
      for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'auxclick', 'touchstart', 'touchend'])
        host.addEventListener(type, (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
    }
    root.append(style);
    root.append(button);
    if (
      !inline &&
      (getComputedStyle(parent).position === 'static' || !getComputedStyle(parent).position)
    )
      this.style(state, parent, 'position', 'relative');
    parent.append(host);
    state.host = host;
    state.hostParent = parent;
    if (!inline && state.anchor) {
      const media = state.anchor;
      const position = () => {
        if (!host.isConnected || !media.isConnected) return;
        const thumbnail = media.getBoundingClientRect();
        const bounds = parent.getBoundingClientRect();
        host.style.setProperty('left', `${thumbnail.left - bounds.left + parent.scrollLeft - parent.clientLeft}px`, 'important');
        host.style.setProperty('top', `${thumbnail.top - bounds.top + parent.scrollTop - parent.clientTop}px`, 'important');
        host.style.setProperty('width', `${thumbnail.width}px`, 'important');
        host.style.setProperty('height', `${thumbnail.height}px`, 'important');
      };
      state.resize = position;
      if (typeof ResizeObserver !== 'undefined') {
        state.observer = new ResizeObserver(position);
        state.observer.observe(media);
        state.observer.observe(parent);
      } else window.addEventListener('resize', position, { passive: true });
      position();
    }
  }
  private blur(card: HTMLElement, state: Saved, targets: ConcealmentTargets) {
    for (const video of card.querySelectorAll('video')) {
      if (!video.paused) video.pause();
    }
    const wantedTitles = new Set(targets.titles);
    const wantedMedia = new Set(targets.thumbnails);
    const wantedAttributes = new Set([
      card,
      ...targets.titles,
      ...targets.thumbnails,
      ...targets.metadata,
    ]);
    for (const node of state.attributes)
      if (!wantedAttributes.has(node)) {
        restoreAttributes(node);
        state.attributes.delete(node);
      }
    for (const [node, saved] of state.titles)
      if (!wantedTitles.has(node)) {
        this.releaseTitle(node, saved);
        restoreAttributes(node);
        state.attributes.delete(node);
        state.titles.delete(node);
      }
    for (const node of state.media)
      if (!wantedMedia.has(node)) {
        this.restoreStyles(state, node);
        this.restoreInert(state, node);
        restoreAttributes(node);
        state.attributes.delete(node);
        delete node.dataset.ssCensoredMedia;
        state.media.delete(node);
      }
    this.metadata(state, card);
    for (const node of targets.metadata) if (!wantedMedia.has(node)) this.metadata(state, node);
    for (const title of targets.titles) this.title(state, title);
    for (const media of targets.thumbnails) {
      state.media.add(media);
      media.dataset.ssCensoredMedia = 'true';
      this.style(state, media, 'filter', 'blur(32px)');
      this.style(state, media, 'clip-path', 'inset(0)');
      this.inert(state, media);
      this.metadata(state, media, true);
    }
    const anchor = targets.thumbnails[0] ?? targets.titles[0];
    if (state.host && !card.contains(state.host)) {
      state.observer?.disconnect();
      if (state.resize) window.removeEventListener('resize', state.resize);
      state.host.remove();
      if (state.hostParent) this.restoreStyles(state, state.hostParent);
      state.host = undefined;
      state.hostParent = undefined;
    }
    if (anchor && !state.host) {
      state.anchor = anchor;
      const inline = !targets.thumbnails.length;
      this.reveal(card, state, inline ? anchor : card, inline);
    }
  }
  conceal(card: HTMLElement, mode: Mode, onReveal: () => void): void {
    let targets =
      mode === 'blur'
        ? concealmentTargets(card, this.adapter)
        : { titles: [], thumbnails: [], metadata: [] };
    let state = this.saved.get(card);
    if (
      state &&
      (state.mode !== mode ||
        (mode === 'blur' &&
          state.anchor !== (targets.thumbnails[0] ?? targets.titles[0])))
    ) {
      this.restore(card);
      state = undefined;
      if (mode === 'blur') targets = concealmentTargets(card, this.adapter);
    }
    if (!state) {
      state = {
        mode,
        styles: new Map(),
        hadStyle: new Map(),
        inert: new Map(),
        attributes: new Set(),
        titles: new Map(),
        media: new Set(),
        onReveal,
      };
      this.saved.set(card, state);
    }
    state.onReveal = onReveal;
    card.dataset.ssState = mode;
    if (mode === 'hide') {
      // Conceal existing playback without reading or analyzing media.
      for (const video of card.querySelectorAll('video')) {
        try {
          video.pause();
        } catch {
          /* The website may replace media during recycling. */
        }
      }
      this.style(state, card, 'display', 'none');
      this.inert(state, card);
      state.attributes.add(card);
      maskAttribute(card, 'aria-hidden', 'true');
    } else this.blur(card, state, targets);
  }
  restore(card: HTMLElement): void {
    const state = this.saved.get(card);
    if (!state) {
      delete card.dataset.ssState;
      return;
    }
    state.host?.remove();
    state.observer?.disconnect();
    if (state.resize) window.removeEventListener('resize', state.resize);
    for (const [node, title] of state.titles) this.releaseTitle(node, title);
    for (const node of state.media) delete node.dataset.ssCensoredMedia;
    for (const node of Array.from(state.styles.keys())) this.restoreStyles(state, node);
    for (const node of Array.from(state.inert.keys())) this.restoreInert(state, node);
    for (const node of state.attributes) restoreAttributes(node);
    delete card.dataset.ssState;
    this.saved.delete(card);
  }
  restoreAll(): void {
    for (const card of document.querySelectorAll<HTMLElement>('[data-ss-state]'))
      this.restore(card);
  }
}
