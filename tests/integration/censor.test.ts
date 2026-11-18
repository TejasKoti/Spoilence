// @vitest-environment jsdom
import { afterEach, test, expect } from "vitest";
import {
  CensorController,
  PROTECTED_TITLE,
} from "../../backend/browser-extension/src/content/censor.js";
import {
  adapters,
  collectText,
  enableConcealmentMutationTracking,
  isConcealmentMutation,
} from "../../backend/browser-extension/src/adapters/index.js";

afterEach(() => document.body.replaceChildren());
function fixture() {
  const card = document.createElement("ytd-video-renderer");
  card.setAttribute("aria-label", "GTA VI ending fictional source metadata");
  card.innerHTML =
    '<a id="thumbnail"><img alt="GTA VI fictional thumbnail" title="GTA VI fictional image" style="filter:brightness(1) !important"><ytd-thumbnail-overlay-time-status-renderer>12:34</ytd-thumbnail-overlay-time-status-renderer></a><h3><a id="video-title" title="GTA VI original title">GTA VI fictional ending <b>source</b></a></h3><ytd-channel-name><h3>Channel name</h3></ytd-channel-name><div id="metadata-line">123K views</div>';
  document.body.append(card);
  return card;
}

test("Hide removes the complete item without a placeholder and restores native style/accessibility", () => {
  const card = fixture();
  card.inert = false;
  card.style.cssText =
    "display: inline-flex !important; position: sticky !important;";
  card.setAttribute("aria-hidden", "false");
  const original = card.getAttribute("style");
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "hide", () => {});
  expect(getComputedStyle(card).display).toBe("none");
  expect(card.style.getPropertyPriority("display")).toBe("important");
  expect(card.inert).toBe(true);
  expect(card.getAttribute("aria-hidden")).toBe("true");
  expect(card.querySelectorAll("[data-ss-owned]")).toHaveLength(0);
  controller.restore(card);
  expect(card.getAttribute("style")).toBe(original);
  expect(card.inert).toBe(false);
  expect(card.getAttribute("aria-hidden")).toBe("false");
});

test("Blur changes only the thumbnail and title while preserving duration, views and channel", () => {
  const card = fixture();
  const title = card.querySelector<HTMLElement>("#video-title")!;
  const sourceNode = title.firstChild;
  const image = card.querySelector<HTMLImageElement>("img")!;
  const originalImageStyle = image.style.cssText;
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  expect(image.style.filter).toBe("blur(32px)");
  expect(image.style.getPropertyPriority("filter")).toBe("important");
  expect(image.alt).toBe("Spoilence protected thumbnail");
  expect(image.getAttribute("aria-label")).toBe(
    "Spoilence protected thumbnail",
  );
  expect(title.querySelector("[data-ss-replacement-title]")?.textContent).toBe(
    PROTECTED_TITLE,
  );
  expect(title.getAttribute("title")).toBe(PROTECTED_TITLE);
  expect(
    title.querySelector<HTMLElement>("[data-ss-original-title]")?.inert,
  ).toBe(true);
  expect(
    getComputedStyle(
      title.querySelector<HTMLElement>("[data-ss-original-title]")!,
    ).display,
  ).toBe("none");
  expect(card.querySelector("ytd-channel-name")?.textContent).toBe(
    "Channel name",
  );
  expect(card.querySelector("#metadata-line")?.textContent).toBe("123K views");
  expect(
    card.querySelector("ytd-thumbnail-overlay-time-status-renderer")
      ?.textContent,
  ).toBe("12:34");
  expect(
    card.querySelector("ytd-channel-name [data-ss-replacement-title]"),
  ).toBeNull();
  expect(card.querySelector("[data-ss-reveal]")?.parentElement).toBe(
    card,
  );
  expect(collectText(card, adapters.youtube)).toContain(
    "GTA VI fictional ending",
  );
  expect(collectText(card, adapters.youtube)).toContain(
    "GTA VI fictional thumbnail",
  );
  expect(collectText(card, adapters.youtube)).not.toContain(PROTECTED_TITLE);
  controller.restore(card);
  expect(image.style.cssText).toBe(originalImageStyle);
  expect(image.alt).toBe("GTA VI fictional thumbnail");
  expect(image.hasAttribute("aria-label")).toBe(false);
  expect(title.firstChild).toBe(sourceNode);
  expect(title.textContent).toBe("GTA VI fictional ending source");
  expect(card.getAttribute("aria-label")).toBe(
    "GTA VI ending fictional source metadata",
  );
});

test("classification keeps original metadata and respects framework changes made during protection", () => {
  const card = fixture();
  const image = card.querySelector<HTMLImageElement>("img")!;
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  image.setAttribute("alt", "Updated synthetic thumbnail");
  expect(collectText(card, adapters.youtube)).toContain(
    "Updated synthetic thumbnail",
  );
  controller.conceal(card, "blur", () => {});
  expect(image.alt).toBe("Spoilence protected thumbnail");
  controller.restore(card);
  expect(image.alt).toBe("Updated synthetic thumbnail");
});

test("switching modes restores the previous mode before applying the next", () => {
  const card = fixture();
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  controller.conceal(card, "hide", () => {});
  expect(card.querySelectorAll("[data-ss-owned]")).toHaveLength(0);
  expect(card.style.display).toBe("none");
  expect(card.querySelector<HTMLImageElement>("img")!.alt).toBe(
    "GTA VI fictional thumbnail",
  );
  controller.conceal(card, "blur", () => {});
  expect(card.style.display).toBe("");
  expect(card.hasAttribute("aria-hidden")).toBe(false);
  expect(card.querySelector("[data-ss-replacement-title]")?.textContent).toBe(
    PROTECTED_TITLE,
  );
  controller.restore(card);
  expect(
    card.querySelectorAll("[data-ss-owned],[data-ss-original-title]"),
  ).toHaveLength(0);
});

test("recycled title children restore the new source rather than reinstating stale content", () => {
  const card = fixture();
  const title = card.querySelector<HTMLElement>("#video-title")!;
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  title.textContent = "New GTA VI fictional finale";
  controller.conceal(card, "blur", () => {});
  expect(title.querySelectorAll("[data-ss-replacement-title]")).toHaveLength(1);
  expect(collectText(card, adapters.youtube)).toContain(
    "New GTA VI fictional finale",
  );
  controller.restore(card);
  expect(title.textContent).toBe("New GTA VI fictional finale");
});

test("recycled thumbnails release old styles/metadata before protecting their replacement", () => {
  const card = fixture();
  const old = card.querySelector<HTMLImageElement>("img")!;
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  const replacement = document.createElement("img");
  replacement.alt = "New synthetic thumbnail";
  old.replaceWith(replacement);
  controller.conceal(card, "blur", () => {});
  expect(old.style.filter).toBe("brightness(1)");
  expect(old.alt).toBe("GTA VI fictional thumbnail");
  expect(replacement.style.filter).toBe("blur(32px)");
  controller.restore(card);
  expect(replacement.style.filter).toBe("");
  expect(replacement.alt).toBe("New synthetic thumbnail");
});

test("title-only comments retain an inline deliberate reveal control after refresh", () => {
  const card = document.createElement("ytd-comment-thread-renderer");
  card.innerHTML = '<div id="content-text">GTA VI fictional ending</div>';
  document.body.append(card);
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  controller.conceal(card, "blur", () => {});
  const title = card.querySelector("#content-text")!;
  expect(title.querySelectorAll("[data-ss-reveal]")).toHaveLength(1);
  expect(
    title.querySelector("[data-ss-original-title] [data-ss-reveal]"),
  ).toBeNull();
  controller.restore(card);
  expect(title.textContent).toBe("GTA VI fictional ending");
});

test("unknown captions receive a source-preserving text replacement while image and metadata remain separate", () => {
  const card = document.createElement("ytd-video-renderer");
  card.innerHTML =
    '<div><img alt="Synthetic thumbnail" style="filter:brightness(.8)"><span>12:34</span></div><p>GTA VI fictional ending</p><span id="views">43,210 views</span><span id="age">7 hours ago</span><a href="/@independent">Independent channel</a>';
  document.body.append(card);
  const image = card.querySelector<HTMLImageElement>("img")!;
  const originalImageStyle = image.style.cssText;
  const caption = card.querySelector("p")!;
  const source = caption.firstChild;
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  expect(getComputedStyle(card).visibility).toBe("visible");
  expect(card.style.opacity).toBe("");
  expect(caption.style.opacity).toBe("");
  expect(caption.inert).not.toBe(true);
  expect(
    caption.querySelector("[data-ss-replacement-title]")?.textContent,
  ).toBe(PROTECTED_TITLE);
  const original = caption.querySelector<HTMLElement>(
    "[data-ss-original-title]",
  )!;
  expect(original.inert).toBe(true);
  expect(getComputedStyle(original).display).toBe("none");
  expect(original.contains(source)).toBe(true);
  expect(image.style.filter).toBe("blur(32px)");
  expect(card.querySelector("[data-ss-reveal]")?.parentElement).toBe(
    card,
  );
  for (const selector of ["#views", "#age", 'a[href="/@independent"]']) {
    const metadata = card.querySelector<HTMLElement>(selector)!;
    expect(metadata.querySelector("[data-ss-replacement-title]")).toBeNull();
    expect(getComputedStyle(metadata).visibility).toBe("visible");
    expect(metadata.style.filter).toBe("");
    expect(metadata.inert).not.toBe(true);
  }
  expect(collectText(card, adapters.youtube)).toContain(
    "GTA VI fictional ending",
  );
  caption.remove();
  const replacement = document.createElement("p");
  replacement.textContent = "GTA VI next fictional ending";
  card.prepend(replacement);
  controller.conceal(card, "blur", () => {});
  expect(caption.textContent).toBe("GTA VI fictional ending");
  expect(caption.contains(source)).toBe(true);
  expect(caption.querySelector("[data-ss-original-title]")).toBeNull();
  expect(
    replacement.querySelector("[data-ss-replacement-title]")?.textContent,
  ).toBe(PROTECTED_TITLE);
  controller.restore(card);
  expect(card.style.visibility).toBe("");
  expect(replacement.textContent).toBe("GTA VI next fictional ending");
  expect(image.style.cssText).toBe(originalImageStyle);
  expect(image.style.clipPath).toBe("");
  expect(image.alt).toBe("Synthetic thumbnail");
  expect(
    card.querySelectorAll("[data-ss-owned],[data-ss-original-title]"),
  ).toHaveLength(0);
});

test("a known heading cannot leave an unmapped spoiler paragraph readable", () => {
  const card = document.createElement("ytd-video-renderer");
  card.innerHTML =
    '<img alt="Synthetic thumbnail"><h2>Ordinary heading</h2><p>GTA VI fictional ending in an unknown caption</p><div id="metadata-line">123K views</div>';
  document.body.append(card);
  const caption = card.querySelector("p")!;
  const source = caption.firstChild;
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  expect(card.style.visibility).toBe("");
  expect(card.style.opacity).toBe("");
  expect(caption.inert).not.toBe(true);
  expect(caption.style.opacity).toBe("");
  expect(
    caption.querySelector("[data-ss-replacement-title]")?.textContent,
  ).toBe(PROTECTED_TITLE);
  expect(
    getComputedStyle(
      caption.querySelector<HTMLElement>("[data-ss-original-title]")!,
    ).display,
  ).toBe("none");
  expect(
    card.querySelector("h2 [data-ss-replacement-title]")?.textContent,
  ).toBe(PROTECTED_TITLE);
  expect(card.querySelector<HTMLImageElement>("img")?.style.filter).toBe(
    "blur(32px)",
  );
  expect(card.querySelector("#metadata-line")?.textContent).toBe("123K views");
  expect(
    card.querySelector("#metadata-line [data-ss-replacement-title]"),
  ).toBeNull();
  expect(collectText(card, adapters.youtube)).toContain("unknown caption");
  controller.restore(card);
  expect(caption.textContent).toBe(
    "GTA VI fictional ending in an unknown caption",
  );
  expect(caption.contains(source)).toBe(true);
  expect(card.querySelector("h2")?.textContent).toBe("Ordinary heading");
  expect(card.querySelector<HTMLImageElement>("img")?.style.filter).toBe("");
  expect(
    card.querySelectorAll("[data-ss-owned],[data-ss-original-title]"),
  ).toHaveLength(0);
});

test("thumbnail-link hover and accessible-name metadata are masked and restored", () => {
  const card = fixture();
  const thumbnail = card.querySelector<HTMLElement>("#thumbnail")!;
  thumbnail.setAttribute("title", "GTA VI fictional thumbnail link");
  thumbnail.setAttribute("aria-label", "GTA VI fictional thumbnail link");
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  expect(thumbnail.getAttribute("title")).toBe(PROTECTED_TITLE);
  expect(thumbnail.getAttribute("aria-label")).toBe(PROTECTED_TITLE);
  expect(collectText(card, adapters.youtube)).toContain(
    "GTA VI fictional thumbnail link",
  );
  controller.restore(card);
  expect(thumbnail.getAttribute("title")).toBe(
    "GTA VI fictional thumbnail link",
  );
  expect(thumbnail.getAttribute("aria-label")).toBe(
    "GTA VI fictional thumbnail link",
  );
});

test("recognized description snippets are protected without hiding known metadata", () => {
  const card = fixture();
  const description = document.createElement("p");
  description.id = "description";
  description.textContent = "GTA VI fictional plot description";
  card.append(description);
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  expect(card.style.visibility).toBe("");
  expect(
    description.querySelector("[data-ss-replacement-title]")?.textContent,
  ).toBe(PROTECTED_TITLE);
  expect(card.querySelector("#metadata-line")?.textContent).toBe("123K views");
  controller.restore(card);
  expect(description.textContent).toBe("GTA VI fictional plot description");
});

test("own wrapping and metadata restoration are distinguishable from genuine source mutations", async () => {
  const card = fixture();
  enableConcealmentMutationTracking();
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((batch) => records.push(...batch));
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [
      "title",
      "aria-label",
      "alt",
      "aria-labelledby",
      "aria-describedby",
    ],
  });
  const external = (record: MutationRecord) => {
    if (isConcealmentMutation(record)) return false;
    if (record.type === "attributes") return true;
    return [...record.addedNodes, ...record.removedNodes].some(
      (node) =>
        !(node instanceof Element && node.hasAttribute("data-ss-owned")),
    );
  };
  const controller = new CensorController(adapters.youtube);
  controller.conceal(card, "blur", () => {});
  await Promise.resolve();
  expect(records.splice(0).filter(external)).toHaveLength(0);
  controller.restore(card);
  await Promise.resolve();
  expect(records.splice(0).filter(external)).toHaveLength(0);
  card.querySelector("#video-title")!.textContent = "New website source";
  await Promise.resolve();
  expect(records.splice(0).filter(external).length).toBeGreaterThan(0);
  observer.disconnect();
});
