/* Per-download acceptance only. No remembered consent or network APIs. */
(() => {
  "use strict";
  const TERMS_VERSION = "2026-11-17.1";
  let dialog, checkbox, confirm, file, version, heading;
  let pending = null;
  let returnFocus = null;
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function reset() {
    pending = null;
    checkbox.checked = false;
    confirm.disabled = true;
  }
  function close() {
    const trigger = returnFocus;
    returnFocus = null;
    dialog.close();
    reset();
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  }
  function create() {
    dialog = element("dialog", "", "download-terms-dialog");
    dialog.id = "download-terms-dialog";
    dialog.setAttribute("aria-labelledby", "download-terms-title");
    const body = element("div", "", "download-terms-body");
    heading = element("h2", "Before you download");
    heading.id = "download-terms-title";
    heading.tabIndex = -1;
    file = element("p", "", "download-terms-file");
    file.id = "download-terms-file";
    version = element("p", "", "download-terms-version");
    version.id = "download-terms-version";
    const summary = element("ul", "", "download-terms-summary");
    for (const text of [
      "This development build is provided as is, without warranties.",
      "Spoilence cannot guarantee that every spoiler will be concealed.",
      "You are responsible for deciding whether to install and use it.",
      "Liability is limited only to the extent permitted by applicable law. Rights that cannot legally be excluded remain yours.",
    ])
      summary.append(element("li", text));
    const terms = element(
      "a",
      "Read the full download terms",
      "download-terms-link",
    );
    terms.href = "/terms.html";
    terms.target = "_blank";
    terms.rel = "noopener";
    const agreement = element("label", "", "download-terms-agreement");
    agreement.htmlFor = "accept-download-terms";
    checkbox = element("input");
    checkbox.id = "accept-download-terms";
    checkbox.type = "checkbox";
    checkbox.required = true;
    checkbox.autocomplete = "off";
    const label = element("span", "I have read and accept the download terms.");
    agreement.append(checkbox, label);
    const actions = element("div", "", "download-terms-actions");
    const cancel = element("button", "Cancel");
    cancel.id = "cancel-download";
    cancel.type = "button";
    confirm = element("button", "Accept and download");
    confirm.id = "confirm-download";
    confirm.type = "button";
    confirm.disabled = true;
    actions.append(cancel, confirm);
    body.append(heading, file, version, summary, terms, agreement, actions);
    dialog.append(body);
    document.body.append(dialog);
    checkbox.addEventListener("change", () => {
      confirm.disabled = !checkbox.checked;
    });
    cancel.addEventListener("click", close);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    dialog.addEventListener("close", reset);
    confirm.addEventListener("click", () => {
      if (!checkbox.checked || !pending) return;
      const approved = pending;
      close();
      const link = element("a");
      link.href = "/downloads/" + approved.filename;
      link.download = approved.filename;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
    });
  }
  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link =
      event.target instanceof Element
        ? event.target.closest("a[data-download-browser]")
        : null;
    if (!link || link.target === "_blank") return;
    const catalog = window.SPOILENCE_BROWSERS;
    const id = link.dataset.downloadBrowser;
    const browser = catalog?.browsers.find((entry) => entry.id === id);
    const download = catalog?.downloads?.[id];
    if (
      !browser ||
      !download ||
      !/^[a-z0-9][a-z0-9_.-]*\.zip$/i.test(download.filename) ||
      download.filename.includes("..")
    )
      return;
    if (typeof window.HTMLDialogElement?.prototype.showModal !== "function")
      return;
    event.preventDefault();
    if (!dialog) create();
    if (dialog.open) close();
    reset();
    pending = {
      filename: download.filename,
      browser: browser.name,
      version: catalog.release.version,
    };
    file.textContent = `${pending.browser}: ${pending.filename}`;
    version.textContent = `Build ${pending.version}. Terms version ${TERMS_VERSION}.`;
    returnFocus = link;
    dialog.showModal();
    heading.focus({ preventScroll: true });
  });
})();
