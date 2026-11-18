import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_SETTINGS,
  type Settings,
} from "../../backend/packages/settings-schema/src/index.js";

const origin = "https://popup.spoilence.test";
const extensionDirectory = path.resolve("build/extensions/chromium");

// The real built popup runs with a synthetic storage/tabs bridge. Actual installed
// browser-extension checks live in the separate installed-extension smoke tools.
async function bootPopup(page: Page, initial: Partial<Settings> = {}) {
  const fixture = {
    values: {
      settings: structuredClone({ ...DEFAULT_SETTINGS, ...initial }),
    } as Record<string, unknown>,
    writes: [] as Record<string, unknown>[],
    messages: [] as { id: number; type: string }[],
    requests: [] as string[],
    errors: [] as string[],
  };
  page.on("request", (request) => fixture.requests.push(request.url()));
  page.on("pageerror", (error) => fixture.errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      fixture.errors.push(`${response.status()} ${response.url()}`);
  });
  await page.exposeFunction("popupFixtureRead", (key: string) => ({
    [key]: fixture.values[key],
  }));
  await page.exposeFunction(
    "popupFixtureWrite",
    (value: Record<string, unknown>) => {
      fixture.writes.push(structuredClone(value));
      Object.assign(fixture.values, structuredClone(value));
    },
  );
  await page.exposeFunction("popupFixtureRemove", (keys: string | string[]) => {
    for (const key of typeof keys === "string" ? [keys] : keys)
      delete fixture.values[key];
  });
  await page.exposeFunction(
    "popupFixtureMessage",
    (id: number, message: { type: string }) => {
      fixture.messages.push({ id, type: message.type });
      return {
        active:
          (fixture.values.settings as Settings | undefined)?.enabled !== false,
        coverage: "recognized",
      };
    },
  );
  await page.addInitScript(() => {
    const fixtureWindow = window as any;
    const listeners: ((
      changes: Record<string, { newValue?: unknown }>,
      area: string,
    ) => void)[] = [];
    fixtureWindow.chrome = {
      storage: {
        local: {
          get: (key: string) => fixtureWindow.popupFixtureRead(key),
          set: async (value: Record<string, unknown>) => {
            if (fixtureWindow.popupFixtureFailSave)
              throw new Error("Synthetic storage failure");
            await fixtureWindow.popupFixtureWrite(value);
            for (const listener of listeners)
              listener(
                Object.fromEntries(
                  Object.entries(value).map(([key, newValue]) => [
                    key,
                    { newValue },
                  ]),
                ),
                "local",
              );
          },
          remove: (keys: string | string[]) =>
            fixtureWindow.popupFixtureRemove(keys),
        },
        onChanged: {
          addListener: (listener: (typeof listeners)[number]) =>
            listeners.push(listener),
        },
      },
      runtime: {
        getURL: (resource: string) => new URL(resource, location.origin).href,
      },
      tabs: {
        query: async () => [{ id: 11 }, { id: 12 }],
        sendMessage: (id: number, message: { type: string }) =>
          fixtureWindow.popupFixtureMessage(id, message),
      },
    };
  });
  await page.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      await route.abort();
      return;
    }
    const resource = path.resolve(
      extensionDirectory,
      "." + decodeURIComponent(new URL(route.request().url()).pathname),
    );
    if (!resource.startsWith(extensionDirectory + path.sep)) {
      await route.fulfill({ status: 404, body: "Not found" });
      return;
    }
    try {
      const contentTypes: Record<string, string> = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".png": "image/png",
      };
      await route.fulfill({
        body: await readFile(resource),
        contentType:
          contentTypes[path.extname(resource)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "Not found" });
    }
  });
  await page.setViewportSize({ width: 380, height: 600 });
  await page.goto(origin + "/popup.html");
  await expect(page.locator("#controls")).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  return fixture;
}

async function revealControl(control: Locator) {
  for (const details of await control
    .locator("xpath=ancestor::details")
    .all()) {
    if (!(await details.getAttribute("open"))) {
      if (
        !(await details.evaluate(
          (element) => (element as HTMLDetailsElement).open,
        ))
      )
        await details.locator(":scope > summary").click();
    }
  }
}

async function storedSettings(fixture: Awaited<ReturnType<typeof bootPopup>>) {
  await expect.poll(() => fixture.values.settings).toBeTruthy();
  return fixture.values.settings as Settings;
}

test("built popup keeps essential controls visible with local assets and accessible semantics", async ({
  page,
  browserName,
}) => {
  const fixture = await bootPopup(page);
  await expect(page.locator("#enabled")).toBeChecked();
  await expect(page.locator("#enabled")).toHaveAttribute("role", "switch");
  await expect(page.locator("#mode-blur")).toBeChecked();
  await expect(page.locator("#mode-hide")).not.toBeChecked();
  expect(
    await page
      .locator('input[name="mode"]')
      .evaluateAll((elements) =>
        elements.map((element) => (element as HTMLInputElement).value),
      ),
  ).toEqual(["blur", "hide"]);
  await expect(page.locator("#thresholdRow")).toBeHidden();
  for (const id of [
    "enabled",
    "mode-hide",
    "mode-blur",
    "sensitivity",
    "youtube",
    "instagram",
    "tiktok",
  ]) {
    const control = page.locator("#" + id);
    await expect(control).toBeVisible();
    const bounds = (await control.boundingBox())!;
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(600);
  }
  for (const id of ["youtube", "instagram", "tiktok"]) {
    const hasLogo = await page.locator("#" + id).evaluate((element) => {
      const label =
        element.closest("label") ??
        document.querySelector(`label[for="${element.id}"]`);
      return !!label?.querySelector("svg,img");
    });
    expect(hasLogo).toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(await page.locator("body").innerText()).not.toContain("\u2014");
  expect(fixture.requests.every((url) => new URL(url).origin === origin)).toBe(
    true,
  );
  expect(fixture.errors).toEqual([]);
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    scan.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  if (browserName === "chromium") {
    const directory = path.resolve("../tests/results/ui");
    await mkdir(directory, { recursive: true });
    await page.screenshot({
      path: path.join(directory, "popup-synthetic-default.png"),
      animations: "disabled",
    });
  }
});

test("mode, three sensitivity positions, protection and site choices persist through reopening", async ({
  page,
}) => {
  const fixture = await bootPopup(page);
  await page.locator("#mode-hide").check();
  await expect
    .poll(() => (fixture.values.settings as Settings).mode)
    .toBe("hide");
  await page.locator("#mode-blur").click();
  await expect
    .poll(() => (fixture.values.settings as Settings).mode)
    .toBe("blur");
  const sensitivity = page.locator("#sensitivity");
  await expect(sensitivity).toHaveAttribute("type", "range");
  await expect(sensitivity).toHaveAttribute("min", "0");
  await expect(sensitivity).toHaveAttribute("max", "2");
  await expect(sensitivity).toHaveAttribute("step", "1");
  await sensitivity.focus();
  await sensitivity.press("Home");
  await sensitivity.press("ArrowRight");
  await expect
    .poll(() => (fixture.values.settings as Settings).sensitivity)
    .toBe("balanced");
  await expect(sensitivity).toHaveAttribute("aria-valuetext", /Balanced/i);
  await sensitivity.press("End");
  await expect
    .poll(() => (fixture.values.settings as Settings).sensitivity)
    .toBe("custom");
  await expect(page.locator("#thresholdRow")).toBeVisible();
  await sensitivity.press("Home");
  await expect
    .poll(() => (fixture.values.settings as Settings).sensitivity)
    .toBe("aggressive");
  await expect(page.locator("#thresholdRow")).toBeHidden();
  await page.locator("#enabled").uncheck();
  for (const site of ["youtube", "instagram", "tiktok"] as const) {
    await page.locator("#" + site).uncheck();
    await expect
      .poll(() => (fixture.values.settings as Settings).sites[site])
      .toBe(false);
  }
  await page.reload();
  await expect(page.locator("#controls")).toBeEnabled();
  await expect(page.locator("#enabled")).not.toBeChecked();
  await expect(page.locator("#mode-blur")).toBeChecked();
  await expect(page.locator("#sensitivity")).toHaveValue("0");
  for (const site of ["youtube", "instagram", "tiktok"])
    await expect(page.locator("#" + site)).not.toBeChecked();
  expect((await storedSettings(fixture)).enabled).toBe(false);
});

test("custom threshold slider and number stay synchronized and clamp without treating blank as zero", async ({
  page,
}) => {
  const fixture = await bootPopup(page, {
    sensitivity: "custom",
    customThreshold: 0.65,
  });
  const number = page.locator("#customThreshold");
  const slider = page.locator("#thresholdSlider");
  await expect(slider).toHaveAttribute("min", "0");
  await expect(slider).toHaveAttribute("max", "1");
  await expect(slider).toHaveAttribute("step", "0.01");
  for (const [input, expected] of [
    ["2.8", "1"],
    ["-0.5", "0"],
    ["0.456", "0.46"],
  ]) {
    await number.fill(input);
    await number.press("Tab");
    await expect(number).toHaveValue(expected);
    await expect(slider).toHaveValue(expected);
    await expect
      .poll(() => (fixture.values.settings as Settings).customThreshold)
      .toBe(Number(expected));
  }
  await number.fill("");
  await number.press("Tab");
  await expect(number).toHaveValue("0.46");
  expect((await storedSettings(fixture)).customThreshold).toBe(0.46);
  await slider.focus();
  await slider.press("End");
  await slider.press("ArrowLeft");
  await expect(number).toHaveValue("0.99");
  await expect
    .poll(() => (fixture.values.settings as Settings).customThreshold)
    .toBe(0.99);
});

test("a failed setting write rolls the controls back and a later edit can save", async ({
  page,
}) => {
  const fixture = await bootPopup(page);
  await page.evaluate(() => {
    (window as any).popupFixtureFailSave = true;
  });
  await page.locator("#mode-hide").click();
  await expect(page.locator("#status")).toContainText(
    /couldn.t save|could not save|save failed/i,
  );
  await expect(page.locator("#mode-blur")).toBeChecked();
  expect((await storedSettings(fixture)).mode).toBe("blur");
  await page.evaluate(() => {
    (window as any).popupFixtureFailSave = false;
  });
  await page.locator("#mode-hide").check();
  await expect
    .poll(() => (fixture.values.settings as Settings).mode)
    .toBe("hide");
});

test("decision clearing, reset cancellation and confirmed reset use the local browser bridge", async ({
  page,
}) => {
  const fixture = await bootPopup(page, {
    enabled: false,
    mode: "hide",
    sensitivity: "custom",
    customThreshold: 0.37,
    sites: { youtube: false, instagram: false, tiktok: true },
  });
  fixture.values.ruleImport = {
    text: "synthetic imported rules",
    digest: "0".repeat(64),
  };
  fixture.values.clearEpoch = 42;
  await revealControl(page.locator("#clear"));
  await page.locator("#clear").click();
  await expect
    .poll(
      () =>
        fixture.messages.filter((message) => message.type === "shield-clear")
          .length,
    )
    .toBe(2);
  await revealControl(page.locator("#fullClear"));
  await page.locator("#fullClear").click();
  await expect(page.locator("#resetDialog")).toBeVisible();
  await page.locator("#cancelReset").click();
  await expect(page.locator("#resetDialog")).toBeHidden();
  expect((await storedSettings(fixture)).mode).toBe("hide");
  await page.locator("#fullClear").click();
  await page.locator("#confirmReset").click();
  await expect(page.locator("#mode-blur")).toBeChecked();
  await expect(page.locator("#sensitivity")).toHaveValue("0");
  await expect(page.locator("#enabled")).toBeChecked();
  for (const site of ["youtube", "instagram", "tiktok"])
    await expect(page.locator("#" + site)).toBeChecked();
  await expect.poll(() => Object.keys(fixture.values)).toEqual([]);
  await expect
    .poll(
      () =>
        fixture.messages.filter((message) => message.type === "shield-clear")
          .length,
    )
    .toBe(4);
});

test("rule imports verify the actual file digest before saving and reject a mismatched digest", async ({
  page,
}) => {
  const fixture = await bootPopup(page);
  const text = JSON.stringify({
    schemaVersion: 1,
    topic: "gta-vi",
    version: "1.2.3",
    aliases: ["gta vi"],
    characterAliases: ["fictional person"],
    riskTerms: ["ending"],
    safePhrases: ["controller settings"],
  });
  const digest = createHash("sha256").update(text).digest("hex");
  await revealControl(page.locator("#ruleFile"));
  await page.locator("#ruleFile").setInputFiles({
    name: "rules.json",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  await page.locator("#digest").fill("0".repeat(64));
  await page.locator("#import").click();
  await expect(page.locator("#status")).toContainText(/rejected/i);
  expect(fixture.values.ruleImport).toBeUndefined();
  await page.locator("#digest").fill(digest);
  await page.locator("#import").click();
  await expect.poll(() => fixture.values.ruleImport).toEqual({ text, digest });
  await expect(page.locator("#ruleFile")).toHaveValue("");
  await expect(page.locator("#digest")).toHaveValue("");
});
