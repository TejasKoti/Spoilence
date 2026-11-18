import { api } from '../platform.js';
import {
  DEFAULT_SETTINGS,
  parseSettings,
  type Settings,
} from '../../../packages/settings-schema/src/index.js';
import { verifyRuleImport } from '../../../packages/rule-engine/src/rule-import.js';

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
// Standalone previews remain responsive; native extension views request a wide toolbar surface.
if (!location.protocol.endsWith('-extension:'))
  document.documentElement.classList.remove('extension-surface');
const levels = ['aggressive', 'balanced', 'custom'] as const;
const levelNames = ['Aggressive', 'Balanced', 'Custom'];
const thresholdInput = byId<HTMLInputElement>('customThreshold');
const thresholdSlider = byId<HTMLInputElement>('thresholdSlider');
const status = (message: string, state = '') => {
  byId('status').textContent = message;
  byId('status').dataset.state = state;
};
let settings: Settings = parseSettings(DEFAULT_SETTINGS),
  lastSaved: Settings = settings,
  lastValidThreshold = settings.customThreshold;
let revision = 0,
  saveQueue = Promise.resolve();

const sensitivity = () =>
  levels[Number(byId<HTMLInputElement>('sensitivity').value)] ?? 'aggressive';
const clampThreshold = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
function showThreshold(value: number) {
  thresholdInput.value = String(value);
  thresholdSlider.value = String(value);
  thresholdSlider.setAttribute('aria-valuetext', String(value));
}
function describe() {
  byId('protectionTitle').textContent = byId<HTMLInputElement>('enabled').checked
    ? 'Protection is on'
    : 'Protection is off';
  const level = sensitivity();
  byId('thresholdRow').hidden = level !== 'custom';
  byId('modeHint').textContent = byId<HTMLInputElement>('mode-hide').checked
    ? 'Remove the whole item. No placeholder or reveal bar.'
    : 'Blur the thumbnail and replace the title. Other details stay visible.';
  byId('sensitivityHint').textContent =
    level === 'aggressive'
      ? 'Cover likely spoilers and uncertain matches.'
      : level === 'balanced'
        ? 'Cover clear matches. Allow uncertain posts.'
        : 'Choose the risk threshold that works for you.';
  const index = levels.indexOf(level);
  byId('sensitivity').setAttribute('aria-valuetext', levelNames[index]);
  document.querySelectorAll<HTMLElement>('[data-level]').forEach((label) => {
    label.dataset.active = String(label.dataset.level === String(index));
  });
}
function render() {
  for (const key of ['enabled', 'lowPower'] as const)
    byId<HTMLInputElement>(key).checked = settings[key];
  byId<HTMLInputElement>('mode-hide').checked = settings.mode === 'hide';
  byId<HTMLInputElement>('mode-blur').checked = settings.mode === 'blur';
  byId<HTMLInputElement>('sensitivity').value = String(levels.indexOf(settings.sensitivity));
  lastValidThreshold = settings.customThreshold;
  showThreshold(lastValidThreshold);
  for (const key of ['youtube', 'instagram', 'tiktok'] as const)
    byId<HTMLInputElement>(key).checked = settings.sites[key];
  describe();
}
async function coverage() {
  try {
    const tab = (await api?.tabs?.query({ active: true, currentWindow: true }))?.[0];
    const result =
      tab?.id === undefined
        ? undefined
        : ((await api?.tabs?.sendMessage(tab.id, { type: 'shield-status' })) as
            { active: boolean; coverage: string } | undefined);
    byId('coverage').textContent = result
      ? !result.active
        ? 'Protection is off on this page.'
        : result.coverage === 'recognized'
          ? 'Supported page items recognized.'
          : 'No supported posts found. This layout may be uncovered.'
      : 'Open YouTube, Instagram or TikTok to check coverage.';
  } catch {
    byId('coverage').textContent = 'Reload your supported website to connect Spoilence.';
  }
}
function save(event?: Event) {
  const rawThreshold = thresholdInput.value.trim();
  const number = thresholdInput.valueAsNumber;
  const invalidThreshold = rawThreshold === '' || !Number.isFinite(number);
  const threshold = invalidThreshold ? lastValidThreshold : clampThreshold(number);
  showThreshold(threshold);
  if (invalidThreshold && (event?.target === thresholdInput || event?.type === 'submit')) {
    status('Threshold unchanged. Enter a number from 0 to 1.', 'error');
    return;
  }
  describe();
  let next: Settings;
  try {
    next = parseSettings({
      ...settings,
      enabled: byId<HTMLInputElement>('enabled').checked,
      lowPower: byId<HTMLInputElement>('lowPower').checked,
      mode: byId<HTMLInputElement>('mode-hide').checked ? 'hide' : 'blur',
      sensitivity: sensitivity(),
      customThreshold: threshold,
      sites: Object.fromEntries(
        ['youtube', 'instagram', 'tiktok'].map((site) => [
          site,
          byId<HTMLInputElement>(site).checked,
        ]),
      ),
    });
  } catch {
    status('Check your preferences, then change the setting again.', 'error');
    return;
  }
  lastValidThreshold = next.customThreshold;
  settings = next;
  const version = ++revision;
  status('Saving...');
  saveQueue = saveQueue
    .catch(() => {})
    .then(async () => {
      if (!api) throw Error('Extension unavailable');
      await api.storage.local.set({ settings: next });
      lastSaved = next;
      if (version === revision) {
        status('Changes saved.', 'saved');
        void coverage();
      }
    })
    .catch(() => {
      if (version === revision) {
        settings = lastSaved;
        render();
        status("Couldn't save. Reopen Spoilence and try again.", 'error');
      }
    });
}
byId('settings').addEventListener('change', save);
byId('settings').addEventListener('submit', (event) => {
  event.preventDefault();
  save(event);
});
byId('sensitivity').addEventListener('input', describe);
thresholdSlider.addEventListener('input', () => {
  showThreshold(clampThreshold(thresholdSlider.valueAsNumber));
});
thresholdInput.addEventListener('input', () => {
  if (thresholdInput.value.trim() !== '' && Number.isFinite(thresholdInput.valueAsNumber)) {
    const value = clampThreshold(thresholdInput.valueAsNumber);
    thresholdSlider.value = String(value);
    thresholdSlider.setAttribute('aria-valuetext', String(value));
  }
});
async function clearDecisions() {
  if (!api) throw Error('Extension unavailable');
  const tabsApi = api.tabs;
  const tabs = await tabsApi?.query({});
  await Promise.allSettled(
    (tabs ?? [])
      .filter((tab) => tab.id !== undefined)
      .map((tab) => tabsApi?.sendMessage(tab.id!, { type: 'shield-clear' })),
  );
}
byId('clear').addEventListener('click', async () => {
  try {
    await saveQueue;
    await clearDecisions();
    status('Decisions cleared in open tabs.', 'saved');
  } catch {
    status("Couldn't clear decisions. Reload your browser tabs.", 'error');
  }
});
byId('fullClear').addEventListener('click', () =>
  byId<HTMLDialogElement>('resetDialog').showModal(),
);
byId('cancelReset').addEventListener('click', () => byId<HTMLDialogElement>('resetDialog').close());
byId('confirmReset').addEventListener('click', async () => {
  byId<HTMLDialogElement>('resetDialog').close();
  byId<HTMLFieldSetElement>('controls').disabled = true;
  try {
    await saveQueue;
    if (!api) throw Error('Extension unavailable');
    await api.storage.local.remove(['settings', 'ruleImport', 'clearEpoch']);
    settings = parseSettings(DEFAULT_SETTINGS);
    lastSaved = settings;
    render();
    await clearDecisions();
    status('Local data reset. Aggressive + Blur restored.', 'saved');
    void coverage();
  } catch {
    status("Couldn't reset local data. Reopen Spoilence and try again.", 'error');
  } finally {
    byId<HTMLFieldSetElement>('controls').disabled = false;
  }
});
byId('import').addEventListener('click', async () => {
  try {
    const file = byId<HTMLInputElement>('ruleFile').files?.[0];
    if (!file || file.size > 128000 || !api) throw Error('Invalid file');
    const text = await file.text(),
      digest = byId<HTMLInputElement>('digest').value.trim();
    await verifyRuleImport(text, digest);
    await api.storage.local.set({ ruleImport: { text, digest } });
    byId<HTMLInputElement>('ruleFile').value = '';
    byId<HTMLInputElement>('digest').value = '';
    status('Verified rule pack installed.', 'saved');
  } catch {
    status('Import rejected. Check the JSON file and trusted checksum.', 'error');
  }
});
async function initialize() {
  try {
    const stored = await api?.storage.local.get('settings');
    if (stored?.settings) settings = parseSettings(stored.settings);
    lastSaved = settings;
    status('Changes save automatically.');
  } catch {
    status("Using protective defaults. Reopen Spoilence if settings don't load.", 'error');
  }
  render();
  byId<HTMLFieldSetElement>('controls').disabled = false;
  void coverage();
}
render();
void initialize();
