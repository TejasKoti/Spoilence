(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const catalog = window.SPOILENCE_BROWSERS;
  window.SpoilenceScene.mount($("shield-scene"));

  let mode = "blur";
  let revealed = false;
  function renderDemo() {
    $("demo-card").dataset.mode = mode;
    $("demo-card").toggleAttribute("data-revealed", revealed);
    $("demo-feed").hidden = mode === "hide" && !revealed;
    $("fictional-title").textContent = revealed
      ? "A completely made-up game ending"
      : "Spoilence Protected - GTA 6 Leak";
    $("reveal-demo").hidden = revealed || mode !== "blur";
    $("reset-demo").hidden = !revealed;
    $("demo-state").parentElement.hidden = mode === "hide";
    $("mode-hide").setAttribute("aria-pressed", String(mode === "hide"));
    $("mode-blur").setAttribute("aria-pressed", String(mode === "blur"));
    $("demo-state").textContent = revealed
      ? "Safe example revealed Â· No real story details"
      : `${mode === "hide" ? "Hide mode Â· Item removed" : "Blur mode Â· Thumbnail and title protected"}`;
  }
  for (const next of ["blur", "hide"])
    $("mode-" + next).addEventListener("click", () => {
      mode = next;
      revealed = false;
      renderDemo();
    });
  $("reveal-demo").addEventListener("click", () => {
    if (mode !== "blur") return;
    revealed = true;
    renderDemo();
    $("reset-demo").focus({ preventScroll: true });
  });
  $("reset-demo").addEventListener("click", () => {
    revealed = false;
    renderDemo();
    $(mode === "blur" ? "reveal-demo" : "mode-hide").focus({
      preventScroll: true,
    });
  });
  renderDemo();

  const browsers = catalog.browsers;
  const select = $("browser-select");
  const ua = navigator.userAgent;
  const mobile =
    /Android|iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let explicitChoice = false;
  let browserPicker = null;
  select.replaceChildren();
  for (const [family, info] of Object.entries(catalog.families)) {
    const group = document.createElement("optgroup");
    group.label = info.label;
    for (const browser of browsers.filter((b) => b.family === family)) {
      const option = document.createElement("option");
      option.value = browser.id;
      option.textContent = browser.name;
      group.append(option);
    }
    select.append(group);
  }
  const detected = /Edg\//.test(ua)
    ? "edge"
    : /OPR\/|Opera/.test(ua)
      ? "opera"
      : /Vivaldi\//.test(ua)
        ? "vivaldi"
        : /LibreWolf\//.test(ua)
          ? "librewolf"
          : /Waterfox\//.test(ua)
            ? "waterfox"
            : /Firefox\//.test(ua)
              ? "firefox"
              : /Chrome\/|Chromium\//.test(ua)
                ? "chrome"
                : /Safari\//.test(ua)
                  ? "safari"
                  : "chromium";
  select.value = detected;
  function setup() {
    const browser = browsers.find((b) => b.id === select.value);
    const family = browser.family;
    const download = catalog.downloads[browser.id];
    $("family-label").textContent = download.folder + " /";
    const downloadLink = document.querySelector(".download-button");
    downloadLink.href = "/download.html#" + browser.id;
    downloadLink.dataset.downloadBrowser = browser.id;
    for (const element of document.querySelectorAll("[data-download-size]"))
      element.textContent = Math.ceil(download.bytes / 1024) + " KB";
    $("download-hash").textContent = download.sha256;
    $("download-name").textContent = download.filename;
    $("browser-status").textContent = browser.validation + ".";
    $("settings-url").value = browser.settings;
    $("settings-tools").hidden = family === "safari";
    $("setup-feedback").textContent = "";
    $("platform-note").textContent = mobile
      ? "You are on a mobile device. Download and install this package on a compatible desktop browser. Mobile setup is not included."
      : "Development build. Browser approval is required. No account or installer.";
    const tools = $("settings-tools");
    const steps = $("install-steps");
    const makeStep = (...parts) => {
      const li = document.createElement("li");
      for (const part of parts) {
        if (Array.isArray(part)) {
          const strong = document.createElement("strong");
          strong.textContent = part[0];
          li.append(strong);
        } else li.append(document.createTextNode(part));
      }
      return li;
    };
    const first = makeStep(["Download"], ` ${download.filename} and `, ["Extract"], " it to a permanent folder.");
    if (family === "safari") {
      steps.replaceChildren(first,
        makeStep("On a Mac, open Safari Settings > Advanced and enable Show features for web developers."),
        makeStep("In Developer, choose ", ["Add Temporary Extension"], " and select the extracted folder."));
      first.append(tools);
    } else {
      const second = makeStep(["Paste the address"], " below into a new tab.");
      second.append(tools);
      const third = family === "firefox"
        ? makeStep("On the browser extensions page, choose ", ["Load Temporary Add-on"], ` \u2192 select manifest.json directly inside ${download.folder}.`)
        : makeStep("In the browser extensions page from the link above, enable ", ["Developer mode"], " \u2192 choose ", ["Load unpacked"], " \u2192 select the ", ["extracted folder"], " you downloaded.");
      steps.replaceChildren(first, second, third);
    }
    $("setup-limit").textContent =
      family === "firefox"
        ? "Unsigned temporary install: load it again after restarting the browser. Modern Firefox-compatible forks require their own runtime checks."
        : family === "safari"
          ? "Mac only. Load the temporary extension again after quitting Safari. No signed Safari store release is included."
          : "Keep the loaded folder in its current location. If your browser rejects the address, open Extensions from its menu. Fork runtime validation varies.";
    browserPicker?.sync();
  }
  select.addEventListener("change", () => {
    explicitChoice = true;
    setup();
  });
  setup();
  browserPicker = window.SpoilenceBrowserPicker?.mount(select) || null;
  if (navigator.brave?.isBrave)
    navigator.brave
      .isBrave()
      .then((isBrave) => {
        if (isBrave && !explicitChoice) {
          select.value = "brave";
          setup();
        }
      })
      .catch(() => {});
  $("copy-settings").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("settings-url").value);
      $("setup-feedback").textContent =
        "Copied. Paste it in a new browser tab.";
    } catch {
      $("settings-url").focus();
      $("settings-url").select();
      $("setup-feedback").textContent =
        "Address selected. Use your keyboard or device Copy command.";
    }
  });
  for (const element of document.querySelectorAll("[data-version]"))
    element.textContent = catalog.release.version;
})();
