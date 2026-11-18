import {
  adapters,
  collectText,
  siteForHost,
  enableConcealmentMutationTracking,
  isConcealmentMutation,
} from '../adapters/index.js';
import { CensorController } from './censor.js';
import { api } from '../platform.js';
import {
  DEFAULT_SETTINGS,
  parseSettings,
  type Settings,
} from '../../../packages/settings-schema/src/index.js';
import { classifyText } from '../../../packages/rule-engine/src/index.js';
import { shouldConceal } from '../../../packages/decision-engine/src/index.js';
import { DecisionCache, createOpaqueKey } from '../../../packages/privacy-cache/src/index.js';
import type { DetectionResult, RulePack } from '../../../packages/detection-contracts/src/index.js';
import { bundledRules } from '../../../packages/rule-packs/src/index.js';

const site = siteForHost(location.hostname);
if (site) {
  const adapter = adapters[site],
    censor = new CensorController(adapter),
    cache = new DecisionCache<DetectionResult>();
  let settings: Settings = parseSettings(DEFAULT_SETTINGS),
    rules: RulePack = bundledRules;
  let ids = new WeakMap<HTMLElement, ReturnType<typeof createOpaqueKey>>();
  const revealed = new WeakSet<HTMLElement>();
  const pendingInert = new WeakMap<HTMLElement, boolean>();
  let scheduled: ReturnType<typeof setTimeout> | undefined;
  let initialized = false;
  let permissionRevoked = false,
    loadVersion = 0;
  const active = () => !permissionRevoked && settings.enabled && settings.sites[site];
  const root = () => document.documentElement;
  // Failure must not lock an entire page. Individual pending cards stay safe.
  const watchdog = setTimeout(() => root()?.setAttribute('data-ss-ready', 'degraded'), 5000);
  function releasePending(card: HTMLElement) {
    const original = pendingInert.get(card);
    if (original !== undefined) {
      card.inert = original;
      pendingInert.delete(card);
    }
  }
  function enqueue(card: HTMLElement, changed = false) {
    if (!active() || card.closest('[data-ss-owned]')) return;
    if (card.parentElement?.closest(adapter.selector)) return;
    if (changed) {
      ids.delete(card);
      revealed.delete(card);
    }
    if (revealed.has(card)) return;
    if (!pendingInert.has(card)) pendingInert.set(card, card.inert);
    card.inert = true;
    if (!['hide', 'blur'].includes(card.dataset.ssState ?? '')) card.dataset.ssState = 'pending';
    card.dataset.ssQueued = 'true';
  }
  function collect(node: Node | null, changed = false) {
    if (!node) return;
    const element = node instanceof Element ? node : node.parentElement;
    if (!element || element.closest('[data-ss-owned]')) return;
    if (
      element instanceof HTMLElement &&
      element.dataset.ssState &&
      !element.matches(adapter.selector)
    ) {
      censor.restore(element);
      delete element.dataset.ssQueued;
      ids.delete(element);
    }
    const parent = element.closest<HTMLElement>(adapter.selector);
    if (parent) enqueue(parent, changed);
    for (const card of element.querySelectorAll<HTMLElement>(adapter.selector))
      enqueue(card, changed);
  }
  function flush() {
    scheduled = undefined;
    if (!initialized || document.hidden || !active()) return;
    let count = 0;
    const queued = document.querySelectorAll<HTMLElement>('[data-ss-queued]');
    // A bounded layout pass prioritizes visible cards without a permanent observer per feed item.
    const sample = Array.from(queued).slice(0, 200);
    const visible = sample.filter((card) => {
      const r = card.getBoundingClientRect();
      return r.bottom >= 0 && r.top <= innerHeight;
    });
    const cards = visible.length ? visible : queued;
    for (const card of cards) {
      delete card.dataset.ssQueued;
      if (!card.isConnected) continue;
      releasePending(card);
      try {
        let id = ids.get(card);
        if (!id) {
          id = createOpaqueKey();
          ids.set(card, id);
        }
        let result = cache.get(id);
        if (!result) {
          result = classifyText(collectText(card, adapter), rules);
          cache.set(id, result);
        }
        if (shouldConceal(result, settings))
          censor.conceal(card, settings.mode, () => revealed.add(card));
        else {
          censor.restore(card);
          card.dataset.ssState = 'allowed';
        }
      } catch {
        censor.conceal(card, settings.mode, () => revealed.add(card));
      }
      if (++count >= (settings.lowPower ? 30 : 100)) break;
    }
    if (document.querySelector('[data-ss-queued]')) schedule();
  }
  function schedule() {
    if (!scheduled && !document.hidden && initialized) scheduled = setTimeout(flush, 0);
  }
  function reset() {
    cache.clear();
    ids = new WeakMap();
    for (const card of document.querySelectorAll<HTMLElement>('[data-ss-state],[data-ss-queued]'))
      releasePending(card);
    censor.restoreAll();
    for (const card of document.querySelectorAll<HTMLElement>('[data-ss-queued]'))
      delete card.dataset.ssQueued;
    for (const card of document.querySelectorAll<HTMLElement>('[data-ss-state]'))
      delete card.dataset.ssState;
    if (!active()) {
      root()?.setAttribute('data-ss-off', 'true');
      return;
    }
    root()?.removeAttribute('data-ss-off');
    collect(document.documentElement, true);
    flush();
  }
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (isConcealmentMutation(record)) continue;
      if (record.type === 'childList') {
        // Feed renderers can replace the thumbnail subtree, including our control.
        // Recreate it even when the removed node itself was extension-owned.
        if ([...record.removedNodes].some((node) =>
          node instanceof HTMLElement && node.hasAttribute('data-ss-reveal'))) {
          const target = record.target instanceof Element ? record.target : record.target.parentElement;
          const card = target?.closest<HTMLElement>(adapter.selector);
          if (card?.dataset.ssState === 'blur') enqueue(card);
        }
        const external = [...record.addedNodes, ...record.removedNodes].some(
          (node) => !(node instanceof Element && node.hasAttribute('data-ss-owned')),
        );
        if (external) {
          for (const node of record.removedNodes)
            if (node instanceof HTMLElement && !node.isConnected) {
              const detached = [node, ...node.querySelectorAll<HTMLElement>('[data-ss-state]')];
              for (const card of detached) {
                releasePending(card);
                censor.restore(card);
                delete card.dataset.ssQueued;
                ids.delete(card);
                revealed.delete(card);
              }
            }
          const target =
            record.target instanceof Element ? record.target : record.target.parentElement;
          const card = target?.closest<HTMLElement>(adapter.selector);
          if (card) enqueue(card, true);
          for (const node of record.addedNodes) collect(node, true);
        }
      } else collect(record.target, true);
    }
    schedule();
  });
  // A site may create a hover preview after concealment. Stop playback without
  // inspecting media and leave revealed or unrelated videos alone.
  document.addEventListener('play', (event) => {
    const video = event.target;
    if (video instanceof HTMLVideoElement && video.closest('[data-ss-state="blur"], [data-ss-state="hide"]'))
      video.pause();
  }, true);
  enableConcealmentMutationTracking();
  observer.observe(document, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [
      'title',
      'aria-label',
      'alt',
      'href',
      'data-e2e',
      'aria-labelledby',
      'aria-describedby',
    ],
  });
  async function init() {
    const version = ++loadVersion;
    if (!document.documentElement)
      await new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (document.documentElement) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(document, { childList: true });
      });
    if (!initialized) {
      initialized = true;
      reset();
      root()?.setAttribute('data-ss-ready', 'true');
      clearTimeout(watchdog);
    }
    let loadedSettings = parseSettings(DEFAULT_SETTINGS),
      loadedRules: RulePack = bundledRules;
    try {
      const stored = await api?.storage.local.get('settings');
      if (stored?.settings) loadedSettings = parseSettings(stored.settings);
      // Imports were verified before storage; validate again before use.
      const imported = await api?.storage.local.get('ruleImport');
      if (imported?.ruleImport) {
        const { verifyRuleImport } =
          await import('../../../packages/rule-engine/src/rule-import.js');
        const entry = imported.ruleImport as { text: string; digest: string };
        loadedRules = await verifyRuleImport(entry.text, entry.digest);
      }
    } catch {
      /* Safe defaults; no page data in errors or diagnostics. */
    }
    if (version !== loadVersion) return;
    settings = loadedSettings;
    rules = loadedRules;
    reset();
  }
  api?.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) {
      try {
        settings = parseSettings(changes.settings.newValue ?? DEFAULT_SETTINGS);
      } catch {
        settings = parseSettings(DEFAULT_SETTINGS);
      }
      reset();
      void init();
    }
    if (changes.clearEpoch) {
      cache.clear();
      reset();
    }
    if (changes.ruleImport) {
      cache.clear();
      rules = bundledRules;
      void init();
    }
  });
  api?.runtime?.onMessage?.addListener((message, _sender, respond) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'shield-clear'
    ) {
      cache.clear();
      ids = new WeakMap();
      respond({ cleared: true });
    }
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'shield-permission-revoked'
    ) {
      permissionRevoked = true;
      reset();
      respond({ cleared: true });
    }
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'shield-status'
    )
      respond({
        site,
        active: active(),
        coverage: document.querySelector(adapter.selector) ? 'recognized' : 'no-supported-items',
      });
  });
  document.addEventListener('visibilitychange', () => {
    cache.resume();
    if (document.hidden) {
      if (scheduled) clearTimeout(scheduled);
      scheduled = undefined;
    } else {
      collect(document.documentElement, true);
      schedule();
    }
  });
  window.addEventListener('pageshow', () => {
    cache.resume();
    if (initialized) reset();
  });
  window.addEventListener('pagehide', () => {
    cache.clear();
  });
  void init();
}
