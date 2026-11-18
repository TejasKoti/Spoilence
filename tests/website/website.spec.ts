import { test, expect, type Page } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { TEST_ORIGIN } from "./test-origin";

async function expectArtwork(page: Page) {
  const image = page.locator(".scene-base");
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate(
        (element) =>
          (element as HTMLImageElement).complete &&
          (element as HTMLImageElement).naturalWidth > 0,
      ),
    )
    .toBe(true);
}

async function renderPath(page: Page) {
  await expect(page.locator("#shield-scene")).toHaveAttribute(
    "data-render-path",
    /^(webgl-halftone|static-fallback)$/,
  );
  return page.locator("#shield-scene").getAttribute("data-render-path");
}
async function renderCount(page: Page) {
  return page
    .locator("#shield-core")
    .evaluate((element) =>
      Number((element as HTMLElement).dataset.renderCount ?? 0),
    );
}

async function selectBrowser(page: Page, id: string) {
  await page.locator("#browser-picker-input").click();
  await page
    .locator(`#browser-options [role="option"][data-value="${id}"]`)
    .click();
  await expect(page.locator("#browser-select")).toHaveValue(id);
}

test("visible website copy and titles avoid em dashes", async ({ page }) => {
  for (const route of ["/", "/privacy.html", "/not-a-page"]) {
    await page.goto(route);
    for (const summary of await page.locator("details summary").all())
      await summary.click();
    expect(await page.title()).not.toContain("\u2014");
    expect(await page.locator("body").innerText()).not.toContain("\u2014");
  }
});

test("ambient pulse has a five-second cadence and rests between finite pulses", async ({
  page,
}) => {
  await page.clock.install({ time: 0 });
  await page.goto("/");
  if ((await renderPath(page)) === "static-fallback") return;
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100);
  const pulse = () =>
    page
      .locator("#shield-core")
      .evaluate((e) => Number((e as HTMLElement).dataset.pulseCount));
  expect(await pulse()).toBe(0);
  for (let i = 0; i < 6 && (await pulse()) === 0; i++)
    await page.clock.fastForward(1000);
  expect(await pulse()).toBe(1);
  const first = await page
    .locator("#shield-core")
    .evaluate((e) => Number((e as HTMLElement).dataset.lastPulseAt));
  await page.clock.runFor(100);
  expect(
    await page
      .locator("#shield-core")
      .evaluate((e) => Number((e as HTMLElement).dataset.pulsePhase)),
  ).toBeGreaterThan(0);
  await page.clock.fastForward(1800);
  const resting = await renderCount(page);
  await page.clock.runFor(1000);
  expect(await renderCount(page)).toBe(resting);
  await page.clock.fastForward(
    5000 - ((await page.evaluate(() => performance.now())) - first),
  );
  expect(await pulse()).toBe(2);
  const second = await page
    .locator("#shield-core")
    .evaluate((e) => Number((e as HTMLElement).dataset.lastPulseAt));
  expect(second - first).toBeGreaterThanOrEqual(4900);
  expect(second - first).toBeLessThanOrEqual(5100);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const stopped = await renderCount(page);
  await page.clock.fastForward(10000);
  expect(await pulse()).toBe(2);
  expect(await renderCount(page)).toBe(stopped);
  await page.evaluate(() => {
    delete (document as any).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(4900);
  expect(await pulse()).toBe(2);
  await page.clock.fastForward(100);
  expect(await pulse()).toBe(3);
});

test("all assets are local, successful and served with restrictive headers", async ({
  page,
  context,
}) => {
  const failures: string[] = [];
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(response?.headers()["content-security-policy"]).toContain(
    "connect-src 'none'",
  );
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(requests.every((url) => new URL(url).origin === TEST_ORIGIN)).toBe(
    true,
  );
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  expect(await context.cookies()).toEqual([]);
});

test("GTA artwork stays local and the editorial hero has no obsolete experiments", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expectArtwork(page);
  expect(
    await page
      .locator(".scene-base")
      .evaluate(
        (element) => new URL((element as HTMLImageElement).currentSrc).pathname,
      ),
  ).toBe("/assets/gta-vi-vice-city.jpg");
  await expect(
    page.locator(
      "#world-city,#world-keys,#motion-toggle,#lens,#patch-pixels,.pixel-edge,#signal-surface,#story-card,.scene-meta",
    ),
  ).toHaveCount(0);
  expect(
    await page
      .locator("#experience-stage")
      .evaluate((element) => getComputedStyle(element).position),
  ).not.toBe("sticky");
  await expect(page.locator("#shield-core")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(
    page.getByRole("link", { name: "Download Spoilence", exact: true }),
  ).toBeInViewport();
});

test("shader compilation failure retains a readable site", async ({ page }) => {
  await page.addInitScript(() => {
    const original = WebGLRenderingContext.prototype.getShaderParameter;
    WebGLRenderingContext.prototype.getShaderParameter = function (
      shader,
      parameter,
    ) {
      if (parameter === this.COMPILE_STATUS) return false;
      return original.call(this, shader, parameter);
    };
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#shield-scene")).toHaveAttribute(
    "data-render-path",
    "static-fallback",
  );
  await expect(page.locator(".core-fallback")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Download Spoilence", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("the canvas recovers after losing its graphics context", async ({
  page,
}) => {
  await page.goto("/");
  if ((await renderPath(page)) === "static-fallback") {
    test.info().annotations.push({
      type: "render-path",
      description: "Context restoration unavailable; fallback only.",
    });
    return;
  }
  await page
    .locator("#shield-core")
    .evaluate((element) =>
      element.dispatchEvent(
        new Event("webglcontextlost", { cancelable: true }),
      ),
    );
  await expect(page.locator("#shield-scene")).toHaveAttribute(
    "data-render-path",
    "static-fallback",
  );
  await expect(page.locator(".core-fallback")).toBeVisible();
  await page
    .locator("#shield-core")
    .evaluate((element) =>
      element.dispatchEvent(new Event("webglcontextrestored")),
    );
  await expect(page.locator("#shield-scene")).toHaveAttribute(
    "data-render-path",
    "webgl-halftone",
  );
  await expect(page.locator(".core-fallback")).toBeHidden();
});

test("download is the real standalone browser ZIP with matching checksum", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await selectBrowser(page, "chrome");
  await page.locator(".download-button").click();
  await expect(page.locator("#confirm-download")).toBeDisabled();
  await page.locator("#accept-download-terms").check();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#confirm-download").click(),
  ]);
  expect(download.suggestedFilename()).toBe("spoilence_chrome.zip");
  const bytes = await readFile((await download.path())!);
  const expected = await readFile(
    fileURLToPath(
      new URL(
        "../../website/public/downloads/spoilence_chrome.zip",
        import.meta.url,
      ),
    ),
  );
  expect(bytes.equals(expected)).toBe(true);
  await page.locator(".integrity-details").locator("summary").click();
  await expect(page.locator("#download-hash")).toHaveText(
    createHash("sha256").update(bytes).digest("hex"),
  );
  const manifest = await request.get("/downloads/package-info.json");
  expect((await manifest.json()).browserOnly).toBe(true);
});

test("the halftone field responds to pointer input instead of merely translating a photograph", async ({
  page,
}) => {
  await page.goto("/");
  const path = await renderPath(page);
  if (path === "static-fallback") {
    await expect(page.locator(".core-fallback")).toBeVisible();
    return;
  }
  await expect.poll(() => renderCount(page)).toBeGreaterThan(0);
  const canvas = page.locator("#shield-core");
  const before = await canvas.screenshot();
  const box = (await page.locator("#shield-scene").boundingBox())!;
  const count = await renderCount(page);
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.35);
  await expect.poll(() => renderCount(page)).toBeGreaterThan(count);
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
});

test("a missing drawing context retains the designed fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type,
      ...args
    ) {
      if (["webgl", "experimental-webgl"].includes(type)) return null;
      return original.apply(this, [type, ...args] as any);
    } as typeof original;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#shield-scene")).toHaveAttribute(
    "data-render-path",
    "static-fallback",
  );
  await expect(page.locator(".core-fallback")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Download Spoilence", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("reduced motion prevents frame requests and can change during the session", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = requestAnimationFrame.bind(window);
    (window as any).websiteFrames = 0;
    window.requestAnimationFrame = (callback) => {
      (window as any).websiteFrames++;
      return original(callback);
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await renderPath(page);
  await page.locator("#shield-scene").dispatchEvent("pointermove", {
    pointerType: "mouse",
    clientX: 600,
    clientY: 350,
  });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).websiteFrames)).toBe(0);
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator("#shield-scene").dispatchEvent("pointermove", {
    pointerType: "mouse",
    clientX: 600,
    clientY: 350,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  const stopped = await page.evaluate(() => (window as any).websiteFrames);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).websiteFrames)).toBe(
    stopped,
  );
});

test("Hide and Blur demo conceal underlying content and reveal intentionally", async ({
  page,
}) => {
  await page.goto("/#demo");
  await expect(page.locator("#demo-feed")).toBeVisible();
  await expect(page.locator("#mode-blur")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#mode-blur").click();
  await expect(page.locator("#demo-card")).toHaveAttribute("data-mode", "blur");
  await expect(page.locator("#fictional-post")).toBeVisible();
  await expect(page.locator("#fictional-title")).toHaveText(
    "Spoilence Protected - GTA 6 Leak",
  );
  await expect(page.locator(".fictional-landscape")).toHaveCSS(
    "filter",
    "blur(32px)",
  );
  await page.locator("#reveal-demo").click();
  await expect(page.locator("#fictional-post")).toBeVisible();
  await expect(page.locator("#reset-demo")).toBeFocused();
  await page.locator("#reset-demo").click();
  await expect(page.locator("#reveal-demo")).toBeFocused();
  await expect(page.locator("#fictional-title")).toHaveText(
    "Spoilence Protected - GTA 6 Leak",
  );
  await page.locator("#mode-hide").click();
  await expect(page.locator("#mode-hide")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#demo-feed")).toBeHidden();
});

test("each browser choice gets the matching folder and honest validation status", async ({
  page,
}) => {
  await page.goto("/#install");
  const entries = await page.evaluate(
    () => (window as any).SPOILENCE_BROWSERS.browsers,
  );
  for (const browser of entries) {
    await selectBrowser(page, browser.id);
    await expect(page.locator("#family-label")).toHaveText(
      `spoilence_${browser.id} /`,
    );
    await expect(page.locator("#browser-status")).toContainText(
      browser.validation,
    );
    await expect(page.locator("#settings-url")).toHaveValue(browser.settings);
    if (browser.family === "firefox")
      await expect(page.locator("#install-steps")).toContainText(
        `manifest.json directly inside spoilence_${browser.id}`,
      );
    if (browser.family === "safari")
      await expect(page.locator("#settings-tools")).toBeHidden();
    await expect(page.locator(".download-button")).toHaveAttribute(
      "href",
      `/download.html#${browser.id}`,
    );
    await expect(page.locator("#install-steps")).toContainText(
      `spoilence_${browser.id}.zip`,
    );
  }
});

test("copy failure selects the address and gives a recovery instruction", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    }),
  );
  await page.goto("/#install");
  await selectBrowser(page, "opera-gx");
  await page.locator("#copy-settings").click();
  await expect(page.locator("#settings-url")).toBeFocused();
  await expect(page.locator("#setup-feedback")).toContainText(
    "Address selected",
  );
});

test("the browser picker shows five rows, scrolls internally and supports keyboard selection", async ({
  page,
}) => {
  await page.goto("/#install");
  await selectBrowser(page, "chrome");
  const combo = page.locator("#browser-picker-input");
  const list = page.locator("#browser-options");
  await expect(combo).toHaveAttribute("role", "combobox");
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await combo.click();
  await expect(list).toBeVisible();
  await expect(list).toHaveAttribute("role", "listbox");
  const catalogCount = await page.evaluate(
    () => (window as any).SPOILENCE_BROWSERS.browsers.length,
  );
  await expect(list.getByRole("option")).toHaveCount(catalogCount);
  const rows = await list.evaluate((element) => {
    const first = element
      .querySelector('[role="option"]')!
      .getBoundingClientRect();
    return {
      visibleRows: element.clientHeight / first.height,
      scrollable: element.scrollHeight > element.clientHeight,
    };
  });
  expect(rows.visibleRows).toBeCloseTo(5, 1);
  expect(rows.scrollable).toBe(true);
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    scan.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  const documentPosition = await page.evaluate(() => scrollY);
  await list.hover();
  await page.mouse.wheel(0, 350);
  await expect
    .poll(() => list.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - documentPosition),
  ).toBeLessThanOrEqual(1);
  await combo.press("Home");
  await combo.press("ArrowDown");
  await combo.press("Enter");
  await expect(page.locator("#browser-select")).toHaveValue("edge");
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await combo.click();
  await combo.press("End");
  await combo.press("Enter");
  await expect(page.locator("#browser-select")).toHaveValue("safari");
  await expect(page.locator("#settings-tools")).toBeHidden();
  await combo.click();
  await combo.press("b");
  await combo.press("r");
  await combo.press("Enter");
  await expect(page.locator("#browser-select")).toHaveValue("brave");
  await combo.click();
  await combo.press("Home");
  await combo.press("Escape");
  await expect(combo).toBeFocused();
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#browser-select")).toHaveValue("brave");
  await combo.click();
  await page.locator("#install-title").click();
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await combo.click();
  await combo.press("Tab");
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await expect(combo).not.toBeFocused();
  await page.setViewportSize({ width: 320, height: 844 });
  await combo.click();
  const popup = (await list.boundingBox())!;
  expect(popup.x).toBeGreaterThanOrEqual(0);
  expect(popup.x + popup.width).toBeLessThanOrEqual(321);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("keyboard skip link, native FAQ and privacy page work", async ({
  page,
}) => {
  await page.goto("/");
  await page.bringToFront();
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  expect(page.url()).toContain("#main");
  const summary = page.locator(".faq-list summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".faq-list details").first()).toHaveAttribute(
    "open",
    "",
  );
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page).toHaveTitle(/Privacy.*Spoilence/);
  await expect(page.locator("h1")).toContainText("Less exposure.");
});

test("automated accessibility checks cover homepage, open controls, mobile, privacy and 404", async ({
  page,
}) => {
  for (const route of ["/", "/privacy.html", "/not-a-page"]) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      scan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#reveal-demo").click();
  await page.locator(".integrity-details summary").click();
  await page.locator(".faq-list summary").first().click();
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    scan.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});

test("damping stops and offscreen work stops", async ({ page, browser }) => {
  await page.goto("/");
  await renderPath(page);
  const box = (await page.locator("#shield-scene").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await page.waitForTimeout(1800);
  const count = await renderCount(page);
  await page.waitForTimeout(200);
  expect(await renderCount(page)).toBe(count);
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.6);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await renderCount(page);
  await page.waitForTimeout(200);
  expect(await renderCount(page)).toBe(hidden);
  await page.evaluate(() => {
    delete (document as any).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.6);
  await page
    .locator("#privacy")
    .evaluate((element) => element.scrollIntoView());
  await expect(page.locator("#shield-core")).not.toBeInViewport();
  await page.waitForTimeout(100);
  const offscreen = await renderCount(page);
  await page.waitForTimeout(200);
  expect(await renderCount(page)).toBe(offscreen);
  const touchContext = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const touch = await touchContext.newPage();
    await touch.goto(TEST_ORIGIN + "/");
    expect(
      await touch
        .locator("#shield-scene")
        .evaluate((element) => getComputedStyle(element).touchAction),
    ).toBe("auto");
    await touch.evaluate(() => scrollTo(0, 300));
    await expect.poll(() => touch.evaluate(() => scrollY)).toBeGreaterThan(0);
  } finally {
    await touchContext.close();
  }
});

test("the circular download card stays round and its actions remain usable across screen sizes", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator("#hero-pitch");
    const bounds = (await card.boundingBox())!;
    expect(Math.abs(bounds.width - bounds.height)).toBeLessThanOrEqual(1);
    expect(
      await card.evaluate((element) => getComputedStyle(element).borderRadius),
    ).toBe("50%");
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    for (const link of await card.getByRole("link").all()) {
      await link.focus();
      await expect(link).toBeFocused();
      await expect(link).toBeVisible();
      const action = (await link.boundingBox())!;
      // Firefox reports a 44px target as 43.999969px after fractional layout.
      expect(Number(action.width.toFixed(3))).toBeGreaterThanOrEqual(44);
      expect(Number(action.height.toFixed(3))).toBeGreaterThanOrEqual(44);
    }
  }
});

test("narrow screens and a zoom-equivalent viewport have no horizontal overflow; capture previews", async ({
  page,
  browserName,
}) => {
  for (const width of [320, 390, 720, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  if (browserName === "chromium") {
    const output = fileURLToPath(
      new URL("../results/website-previews/", import.meta.url),
    );
    await mkdir(output, { recursive: true });
    await page.reload();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await page.screenshot({
      path: output + "desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await page.screenshot({
      path: output + "mobile.png",
      fullPage: true,
      animations: "disabled",
    });
  }
});

test("no JavaScript still provides downloads and installation fallback; unknown URLs return 404", async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(TEST_ORIGIN + "/");
  await expect(
    page.getByRole("link", { name: "Download Spoilence", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".noscript-note")).toContainText(
    "Extract the named ZIP",
  );
  await page.goto(TEST_ORIGIN + "/download.html#firefox");
  const form = page.locator('form[action="/downloads/spoilence_firefox.zip"]');
  await form.getByRole("button").click();
  expect(
    await form
      .locator("input")
      .evaluate((input) => (input as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await form.locator("input").check();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    form.getByRole("button").click(),
  ]);
  expect(download.suggestedFilename()).toBe("spoilence_firefox.zip");
  await context.close();
  const missing = await request.get("/this-page-does-not-exist");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("A wrong turn.");
});

test("all download entry points require fresh acceptance and cancellation sends no ZIP request", async ({
  page,
}) => {
  const archiveRequests: string[] = [];
  page.on("request", (request) => {
    if (/\.zip(?:\?|$)/.test(request.url()))
      archiveRequests.push(request.url());
  });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/\.zip(?:\?|$)/.test(request.url())) requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator('.hero-pitch a[href="#install"]')).toHaveCount(1);
  await expect(
    page.locator(".closing-section a[data-download-browser]"),
  ).toHaveCount(0);
  await page.locator('.hero-pitch a[href="#install"]').click();
  await expect(page.locator("#download-terms-dialog")).toBeHidden();
  await expect(page.locator("#install")).toBeInViewport();
  for (const selector of [".download-button"]) {
    const trigger = page.locator(selector);
    await trigger.click();
    await expect(page.locator("#download-terms-dialog")).toBeVisible();
    await expect(page.locator("#accept-download-terms")).not.toBeChecked();
    await expect(page.locator("#confirm-download")).toBeDisabled();
    await expect(page.locator(".download-terms-link")).toHaveAttribute(
      "href",
      "/terms.html",
    );
    await page.locator("#accept-download-terms").check();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(page.locator("#accept-download-terms")).not.toBeChecked();
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      scan.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    await page.locator("#cancel-download").click();
    await expect(trigger).toBeFocused();
  }
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  await page.setViewportSize({ width: 320, height: 600 });
  await page.locator(".download-button").click();
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    scan.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  const bounds = (await page.locator("#download-terms-dialog").boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  await page.keyboard.press("Escape");
  expect(archiveRequests).toEqual([]);
  await page.goto("/terms.html");
  await expect(page.locator("#terms-version")).toContainText("2026-11-17.1");
  await expect(page.locator("main")).toContainText("AS IS");
  await expect(page.locator("main")).toContainText("nonwaivable");
  for (const path of ["/terms.html", "/download.html"]) {
    await page.goto(path);
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      scan.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  }
});

test("record a synthetic pointer-frame benchmark without claiming device certification", async ({
  page,
  browser,
  browserName,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const scene = document.getElementById("shield-scene")!;
    const box = scene.getBoundingClientRect();
    const samples: number[] = [];
    for (let i = 0; i < 60; i++) {
      const start = performance.now();
      scene.dispatchEvent(
        new PointerEvent("pointermove", {
          pointerType: "mouse",
          clientX: box.left + box.width * (0.2 + (i % 10) / 16),
          clientY: box.top + box.height * (0.2 + (i % 7) / 12),
        }),
      );
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    return {
      samples: samples.length,
      inputToFrameCallbackP95Ms: samples[Math.ceil(samples.length * 0.95) - 1],
      resources: performance.getEntriesByType("resource").length,
      renderPath: scene.dataset.renderPath,
      canvasCount: document.querySelectorAll("canvas").length,
      canvasBackingPixels: [...document.querySelectorAll("canvas")].reduce(
        (sum, canvas) => sum + canvas.width * canvas.height,
        0,
      ),
      notes:
        "Local headless synthetic dispatch to the next frame callback; includes scheduling, not a hardware paint acknowledgement or low-end device certification.",
    };
  });
  const output = fileURLToPath(
    new URL("../results/website-performance/", import.meta.url),
  );
  await mkdir(output, { recursive: true });
  await writeFile(
    output + browserName + ".json",
    JSON.stringify(
      { browser: browserName, version: browser.version(), ...result },
      null,
      2,
    ) + "\n",
  );
  expect(result.samples).toBe(60);
  expect(["webgl-halftone", "static-fallback"]).toContain(result.renderPath);
  expect(result.canvasCount).toBe(1);
  expect(result.canvasBackingPixels).toBeLessThanOrEqual(2000000);
});
