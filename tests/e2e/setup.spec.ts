import { test, expect } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";
import catalog from "../../backend/browser-targets.json" with { type: "json" };
const start = pathToFileURL(path.resolve("../product/START-HERE.html")).href;

test("setup detects the browser engine", async ({ page, browserName }) => {
  await page.goto(start);
  expect(await page.locator("#browser").inputValue()).toBe(
    browserName === "firefox"
      ? "firefox"
      : browserName === "webkit"
        ? "safari"
        : "chrome",
  );
});

test("every catalog browser routes to its engine folder and settings", async ({
  page,
}) => {
  await page.goto(start + "?device=mac");
  for (const browser of catalog.browsers) {
    await page.locator("#browser").selectOption(browser.id);
    await page.locator("#showSteps").click();
    await expect(page.locator("#steps")).toBeVisible();
    const location = await page.locator("#extensionPath").inputValue();
    expect(location).toBe(
      `spoilence_${browser.id}` +
        (browser.family === "firefox" ? "/manifest.json" : ""),
    );
    await expect(page.locator("#browserDownload")).toHaveAttribute(
      "download",
      `spoilence_${browser.id}.zip`,
    );
    if (browser.family === "firefox")
      expect(location).toMatch(/manifest\.json$/);
    else expect(location).not.toMatch(/manifest\.json$/);
    await expect(page.locator("#settingsAddress")).toHaveValue(
      browser.settings,
    );
    await expect(page.locator("#availability")).toContainText(
      browser.validation,
    );
  }
});

test("mobile gets no app download or unsupported installation path", async ({
  page,
}) => {
  for (const device of ["android", "ios"]) {
    await page.goto(start + "?device=" + device);
    await expect(page.locator("#showSteps")).toBeHidden();
    await expect(page.locator("#platformTitle")).toContainText(
      "desktop browsers",
    );
    await expect(
      page.locator('a[href$=".apk"],a[href$=".ipa"],a[href$=".exe"]'),
    ).toHaveCount(0);
  }
});

test("guide is offline, keyboard usable and responsive", async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(start + "?device=desktop&browser=opera-gx");
  await page.locator("#preview").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#preview")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#showSteps").click();
  await expect(page.locator("#stepsHeading")).toBeFocused();
  await expect(page.locator("#settingsAddress")).toHaveValue(
    "opera://extensions/",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Mac Safari has temporary folder steps; other devices do not", async ({
  page,
}) => {
  await page.goto(start + "?device=mac&browser=safari");
  await page.locator("#showSteps").click();
  await expect(page.locator("#stepList")).toContainText(
    "Add Temporary Extension",
  );
  await expect(page.locator("#copyAddress")).toBeHidden();
  await page.locator("#device").selectOption("desktop");
  await expect(page.locator("#showSteps")).toBeHidden();
});

test("Opera UA routes before Chrome and Brave identity never overwrites an explicit selection", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Chrome/145.0.0.0 Safari/537.36 OPR/130.0.0.0",
      configurable: true,
    });
  });
  await page.goto(start + "?device=desktop");
  await expect(page.locator("#browser")).toHaveValue("opera");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "brave", {
      value: { isBrave: () => Promise.resolve(true) },
    });
  });
  await page.goto(start + "?device=desktop");
  await expect(page.locator("#browser")).toHaveValue("brave");
  await page.goto(start + "?device=desktop&browser=opera-gx");
  await expect(page.locator("#browser")).toHaveValue("opera-gx");
});
