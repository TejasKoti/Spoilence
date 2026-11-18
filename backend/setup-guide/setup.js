(() => {
  const $ = (id) => document.getElementById(id);
  const catalog = window.SPOILENCE_BROWSERS;
  const download = document.createElement('a');
  download.id = 'browserDownload';
  download.className = 'primary';
  $('platformDescription').after(download);
  const ua = navigator.userAgent;
  const detectedDevice = /Android/i.test(ua)
    ? 'android'
    : /iPhone|iPad|iPod/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      ? 'ios'
      : /Mac/i.test(ua)
        ? 'mac'
        : 'desktop';
  // Some privacy browsers deliberately share a UA. Keep a manual override.
  const detectedBrowser = /Edg\//.test(ua)
    ? 'edge'
    : /OPR\/|Opera/.test(ua)
      ? 'opera'
      : /Vivaldi\//.test(ua)
        ? 'vivaldi'
        : /LibreWolf\//.test(ua)
          ? 'librewolf'
          : /Waterfox\//.test(ua)
            ? 'waterfox'
            : /Firefox\//.test(ua)
              ? 'firefox'
              : /Chrome\/|Chromium\//.test(ua)
                ? 'chrome'
                : /Safari\//.test(ua)
                  ? 'safari'
                  : 'chromium';
  const query = new URLSearchParams(location.search);
  for (const [family, info] of Object.entries(catalog.families)) {
    const group = document.createElement('optgroup');
    group.label = info.label;
    for (const entry of catalog.browsers.filter((b) => b.family === family)) {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.name;
      group.append(option);
    }
    $('browser').append(group);
  }
  const devices = ['desktop', 'mac', 'android', 'ios'];
  $('device').value = devices.includes(query.get('device')) ? query.get('device') : detectedDevice;
  $('browser').value = catalog.browsers.some((b) => b.id === query.get('browser'))
    ? query.get('browser')
    : detectedBrowser;
  function render() {
    const device = $('device').value;
    const browser = catalog.browsers.find((b) => b.id === $('browser').value);
    const mobile = device === 'android' || device === 'ios';
    const safari = browser.family === 'safari';
    const available = !mobile && (!safari || device === 'mac');
    const archive = catalog.downloads[browser.id];
    download.hidden = !available;
    download.href = archive.path;
    download.download = archive.filename;
    download.textContent = `Download ${archive.filename}`;
    $('steps').hidden = true;
    $('showSteps').hidden = !available;
    $('showSteps').setAttribute('aria-expanded', 'false');
    $('copyAddress').hidden = safari;
    $('settingsAddress').closest('label').hidden = safari;
    $('detected').textContent = 'Your archive: ' + archive.filename;
    $('setupStatus').textContent = '';
    $('availability').hidden = false;
    $('availability').textContent =
      browser.validation + '. Minimum: ' + catalog.families[browser.family].minimum + '.';
    if (!available) {
      $('platformTitle').textContent = mobile
        ? 'This package is for desktop browsers.'
        : 'Safari setup requires a Mac.';
      $('platformDescription').textContent =
        'Use this package on Windows, macOS or Linux with a compatible desktop browser. Mobile installation is not supported by this release.';
      return;
    }
    $('platformTitle').textContent = `Set up for ${browser.name}`;
    $('platformDescription').textContent = safari
      ? 'On Mac, Safari 18.4 or later can temporarily load the extracted folder. Actual Safari validation is still pending.'
      : 'Download your browser ZIP, extract it to a permanent folder, and load that folder directly.';
    $('showSteps').textContent = `Show ${browser.name} steps`;
    $('stepsHeading').textContent = `${browser.name} setup`;
    $('settingsAddress').value = browser.settings;
    const firefox = browser.family === 'firefox';
    $('extensionPath').value = archive.folder + (firefox ? '/manifest.json' : '');
    const steps = safari
      ? [
          'In Safari Settings > Advanced, enable "Show features for web developers". Safari 18.4 or later on Mac is required.',
          `In the Developer tab, choose "Add Temporary Extension" and select your extracted ${archive.folder} folder.`,
          'Grant access to the supported websites and reload them. Load the extension again after quitting Safari.',
        ]
      : firefox
        ? [
            `Paste the settings address below into a new ${browser.name} tab.`,
            `Choose "Load Temporary Add-on" and select manifest.json directly inside your extracted ${archive.folder} folder.`,
            'Reload YouTube, Instagram or TikTok. Open Spoilence from the extensions menu. This unsigned temporary install must be loaded again after restarting the browser.',
          ]
        : [
            `Paste the settings address below into a new ${browser.name} tab. If your fork rejects it, open Extensions from its menu.`,
            `Enable "Developer mode", choose "Load unpacked", and select your extracted ${archive.folder} folder. There is no nested browser-type folder.`,
            'Reload YouTube, Instagram or TikTok. Pin Spoilence in the extensions menu. Keep the loaded folder in its current location.',
          ];
    $('stepList').replaceChildren(
      ...[
        `Download ${archive.filename} and extract it into a permanent ${archive.folder} folder.`,
        ...steps,
      ].map((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        return li;
      }),
    );
  }
  let chosen = query.has('browser');
  for (const id of ['device', 'browser'])
    $(id).addEventListener('change', () => {
      if (id === 'browser') chosen = true;
      const next = new URL(location.href);
      next.searchParams.set('device', $('device').value);
      next.searchParams.set('browser', $('browser').value);
      history.replaceState(null, '', next);
      render();
    });
  // Local identity API only. Never change an explicit browser selection.
  if (!chosen && navigator.brave?.isBrave)
    navigator.brave
      .isBrave()
      .then((isBrave) => {
        if (isBrave && !chosen) {
          $('browser').value = 'brave';
          render();
        }
      })
      .catch(() => {});
  $('showSteps').addEventListener('click', () => {
    $('steps').hidden = false;
    $('showSteps').setAttribute('aria-expanded', 'true');
    $('stepsHeading').focus();
  });
  for (const [button, input, label] of [
    ['copyAddress', 'settingsAddress', 'Settings address'],
    ['copyPath', 'extensionPath', 'Extension location'],
  ])
    $(button).addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($(input).value);
        $('setupStatus').textContent = `${label} copied.`;
      } catch {
        $(input).focus();
        $(input).select();
        $('setupStatus').textContent =
          `${label} selected. Use your keyboard or device Copy command.`;
      }
    });
  $('preview').addEventListener('click', () => {
    const revealed = $('preview').getAttribute('aria-pressed') !== 'true';
    $('preview').setAttribute('aria-pressed', String(revealed));
    $('curtain').hidden = revealed;
    $('preview').textContent = revealed ? 'Cover the demo again' : 'Reveal the safe demo';
  });
  render();
})();
