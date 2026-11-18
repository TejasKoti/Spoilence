import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const content = await readFile("build/extensions/chromium/content.js", "utf8");
const css = await readFile("build/extensions/chromium/guard.css", "utf8");
const startupGuard = await readFile(
  "build/extensions/chromium/guard.js",
  "utf8",
);
// Synthetic page runtime tests. Actual extension loading is tested separately.
async function boot(
  page: Page,
  host = "www.youtube.com",
  body = "<ytd-rich-item-renderer><h2>GTA VI ending fictional test</h2></ytd-rich-item-renderer>",
) {
  await page.route(`https://${host}/**`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><style>${css}</style><script>window.fixtureFirstPaint=[];requestAnimationFrame(()=>{const c=document.querySelector('ytd-rich-item-renderer,article,[data-e2e]');const s=c&&getComputedStyle(c);window.fixtureFirstPaint.push(!!c&&s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)>0&&c.getBoundingClientRect().height>0)})</script></head><body>${body}</body></html>`,
    }),
  );
  await page.addInitScript(() => {
    // These fixtures exercise Hide explicitly. The popup tests cover the actual
    // Blur-first default independently.
    const data: Record<string, unknown> = { settings: { mode: "hide" } };
    const listeners: ((
      changes: Record<string, { newValue?: unknown }>,
      area: string,
    ) => void)[] = [];
    (window as any).chrome = {
      storage: {
        local: {
          get: async (key: string) => ({ [key]: data[key] }),
          set: async (value: Record<string, unknown>) => {
            Object.assign(data, value);
            for (const l of listeners)
              l(
                Object.fromEntries(
                  Object.entries(value).map(([k, v]) => [k, { newValue: v }]),
                ),
                "local",
              );
          },
          remove: async (keys: string[]) => {
            for (const k of keys) delete data[k];
          },
        },
        onChanged: { addListener: (l: any) => listeners.push(l) },
      },
    };
    (window as any).fixtureStorage = data;
  });
  await page.addInitScript({ content });
  await page.goto(`https://${host}/feed`);
  await expect(page.locator("html")).toHaveAttribute("data-ss-ready", "true");
}
async function preferences(page: Page, settings: Record<string, unknown>) {
  await page.evaluate(async (settings) => {
    const storage = (window as any).chrome.storage.local;
    const existing = (await storage.get("settings")).settings ?? {};
    await storage.set({
      settings: {
        ...existing,
        ...settings,
        ...(settings.sites
          ? {
              sites: {
                ...existing.sites,
                ...(settings.sites as Record<string, unknown>),
              },
            }
          : {}),
      },
    });
  }, settings);
}
const protectedTitle = "Spoilence Protected - GTA 6 Leak";
const thumbnail =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23ed9c68'/%3E%3C/svg%3E";
function richCard() {
  return `<ytd-video-renderer id="protected-card" style="display:block;width:320px" aria-label="GTA VI fictional ending card" title="GTA VI fictional ending card" aria-labelledby="video-title" aria-describedby="description">
    <div id="thumbnail-wrap" style="position:relative;width:320px;height:180px"><img id="thumbnail" src="${thumbnail}" width="320" height="180" alt="GTA VI fictional ending thumbnail" title="GTA VI fictional ending thumbnail" style="display:block;filter:brightness(.8)!important"><ytd-thumbnail-overlay-time-status-renderer id="duration">12:34</ytd-thumbnail-overlay-time-status-renderer></div>
    <h2><a id="video-title" href="/watch?v=synthetic" title="GTA VI fictional ending title" aria-label="GTA VI fictional ending title">GTA VI fictional ending</a></h2>
    <div id="channel-name"><a href="/channel/synthetic">Calm Studio</a></div><div id="metadata-line"><span id="views">81K views</span><span id="published">2 days ago</span></div><p id="description">A synthetic fixture.</p>
  </ytd-video-renderer>`;
}
test("every censored thumbnail intercepts clicks and stops newly started previews", async ({ page }) => {
  const cards = Array.from({ length: 8 }, (_, i) =>
    `<ytd-video-renderer class="fixture-card" style="display:block;position:relative;width:320px">
      <a href="/watch?v=${i}" class="thumbnail-link" style="display:block;width:320px;height:180px;position:relative">
        <img src="${thumbnail}" width="320" height="180" style="display:block">
      </a><h2>GTA VI fictional ending ${i}</h2>
    </ytd-video-renderer>`,
  ).join("");
  await boot(page, "www.youtube.com", cards);
  await preferences(page, { mode: "blur" });
  const all = page.locator(".fixture-card");
  await expect(page.locator('[data-ss-reveal]')).toHaveCount(8);
  const last = all.nth(7);
  await last.scrollIntoViewIfNeeded();
  await last.evaluate((card) => {
    card.addEventListener('click', () => card.setAttribute('data-site-clicked', 'true'));
    const video = document.createElement('video');
    video.pause = () => card.setAttribute('data-preview-paused', 'true');
    card.append(video);
    video.dispatchEvent(new Event('play'));
  });
  await expect(last).toHaveAttribute('data-preview-paused', 'true');
  await expect(last.locator('[data-ss-reveal]')).toHaveCount(1);
  await last.locator('[data-ss-reveal]').click();
  await expect(last).not.toHaveAttribute('data-ss-state');
  await expect(last).not.toHaveAttribute('data-site-clicked');
  await expect(last.locator('h2')).toHaveText('GTA VI fictional ending 7');
});
test("YouTube guards feed, search, recommendations, Shorts, comments and metadata", async ({
  page,
}) => {
  const tags = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-reel-video-renderer",
    "ytd-comment-thread-renderer",
    "yt-lockup-view-model",
    "ytm-rich-item-renderer",
    "ytm-video-with-context-renderer",
    "ytm-comment-thread-renderer",
  ];
  await boot(
    page,
    "www.youtube.com",
    tags
      .map(
        (tag, i) =>
          `<${tag} id="card${i}"><img alt="GTA VI ending fictional test"><h2>Fictional title</h2></${tag}>`,
      )
      .join(""),
  );
  for (let i = 0; i < tags.length; i++)
    await expect(page.locator(`#card${i}`)).toHaveAttribute(
      "data-ss-state",
      "hide",
    );
  expect(
    await page.evaluate(() => (window as any).fixtureFirstPaint),
  ).not.toContain(true);
  await expect(page.locator("#card0 h2")).toBeHidden();
});
test("dynamic insertion and recycled safe card are concealed before next paint", async ({
  page,
}) => {
  await boot(
    page,
    "www.youtube.com",
    "<ytd-video-renderer><h2>Gardening advice</h2></ytd-video-renderer>",
  );
  await expect(page.locator("ytd-video-renderer")).toHaveAttribute(
    "data-ss-state",
    "allowed",
  );
  const visible = await page.evaluate(async () => {
    document.querySelector("h2")!.textContent = "GTA VI fictional ending";
    return await new Promise((resolve) =>
      requestAnimationFrame(() =>
        resolve(
          (() => {
            const card = document.querySelector("ytd-video-renderer")!;
            const style = getComputedStyle(card);
            return (
              style.display !== "none" &&
              style.visibility === "visible" &&
              Number(style.opacity) > 0 &&
              card.getBoundingClientRect().height > 0
            );
          })(),
        ),
      ),
    );
  });
  expect(visible).toBe(false);
  await expect(page.locator("ytd-video-renderer")).toHaveAttribute(
    "data-ss-state",
    "hide",
  );
  await page.evaluate(() => {
    const card = document.createElement("ytd-rich-item-renderer");
    card.innerHTML = "<h2>GTA6 fictional betrayal</h2>";
    document.body.append(card);
  });
  await expect(page.locator("ytd-rich-item-renderer")).toHaveAttribute(
    "data-ss-state",
    "hide",
  );
});
test("Hide removes the entire post without a bar and mode, OFF and per-site changes restore it", async ({
  page,
}) => {
  await boot(page);
  const card = page.locator("ytd-rich-item-renderer");
  await expect(card).toHaveAttribute("data-ss-state", "hide");
  await expect(card).toBeHidden();
  expect(
    await card.evaluate((element) => getComputedStyle(element).display),
  ).toBe("none");
  expect(await card.boundingBox()).toBeNull();
  await expect(page.locator("[data-ss-owned]")).toHaveCount(0);
  await preferences(page, { mode: "blur" });
  await expect(page.locator("ytd-rich-item-renderer")).toHaveAttribute(
    "data-ss-state",
    "blur",
  );
  await expect(card).toBeVisible();
  await preferences(page, { mode: "hide" });
  await expect(card).toHaveAttribute("data-ss-state", "hide");
  await expect(card).toBeHidden();
  await expect(page.locator("[data-ss-owned]")).toHaveCount(0);
  await preferences(page, { enabled: false });
  await expect(page.locator("h2")).toBeVisible();
  await expect(page.locator("[data-ss-owned]")).toHaveCount(0);
  await preferences(page, { enabled: true, sites: { youtube: false } });
  await expect(page.locator("h2")).toBeVisible();
  await preferences(page, { sites: { youtube: true } });
  await expect(card).toBeHidden();
  await expect(card).toHaveAttribute("data-ss-state", "hide");
});
test("sensitivity modes and no detection network/storage content", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await boot(
    page,
    "www.youtube.com",
    "<ytd-video-renderer><h2>GTA VI controller settings</h2></ytd-video-renderer>",
  );
  await expect(page.locator("ytd-video-renderer")).toHaveAttribute(
    "data-ss-state",
    "hide",
  );
  await preferences(page, { sensitivity: "balanced" });
  await expect(page.locator("ytd-video-renderer")).toHaveAttribute(
    "data-ss-state",
    "allowed",
  );
  await preferences(page, { sensitivity: "custom", customThreshold: 0.6 });
  await expect(page.locator("ytd-video-renderer")).toHaveAttribute(
    "data-ss-state",
    "hide",
  );
  expect(requests).toEqual(["https://www.youtube.com/feed"]);
  const stored = await page.evaluate(() =>
    JSON.stringify((window as any).fixtureStorage),
  );
  expect(stored).not.toContain("controller");
  expect(stored).not.toContain("GTA");
});
for (const [host, body, selector] of [
  [
    "www.instagram.com",
    '<main><article><img alt="GTA VI fictional ending"><p>Sample</p></article></main>',
    "article",
  ],
  [
    "www.tiktok.com",
    '<div data-e2e="recommend-list-item-container"><h2>GTA VI fictional ending</h2></div>',
    '[data-e2e="recommend-list-item-container"]',
  ],
])
  test(`${host} independently conceals and restores`, async ({ page }) => {
    await boot(page, host, body);
    await expect(page.locator(selector)).toHaveAttribute(
      "data-ss-state",
      "hide",
    );
    await preferences(page, { enabled: false });
    await expect(page.locator(selector)).toBeVisible();
  });
test("unknown layouts remain usable; navigation/resume handles new content", async ({
  page,
}) => {
  await boot(
    page,
    "www.youtube.com",
    '<section id="unknown">Fictional unsupported layout</section>',
  );
  await expect(page.locator("#unknown")).toBeVisible();
  await page.evaluate(() => {
    history.pushState({}, "", "/results");
    const card = document.createElement("ytd-video-renderer");
    card.innerHTML = "<h2>GTA VI fictional finale</h2>";
    document.body.append(card);
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );
  });
  await expect(page.locator("ytd-video-renderer")).toHaveAttribute(
    "data-ss-state",
    "hide",
  );
});
test("Blur filters the thumbnail, masks title and accessibility metadata, preserves bylines and restores originals on OFF", async ({
  page,
}) => {
  await boot(page, "www.youtube.com", richCard());
  const originalThumbnailStyle = await page
    .locator("#thumbnail")
    .evaluate((element) => (element as HTMLElement).style.cssText);
  await preferences(page, { mode: "blur" });
  const card = page.locator("#protected-card");
  await expect(card).toHaveAttribute("data-ss-state", "blur");
  await expect(card).toBeVisible();
  await expect(page.locator("#video-title")).toHaveText(
    /Spoilence Protected - GTA 6 Leak/,
  );
  expect(await page.locator("#video-title").innerText()).toBe(protectedTitle);
  await expect(
    page.locator("#video-title [data-ss-replacement-title]"),
  ).toHaveText(protectedTitle);
  expect(await page.locator("#description").innerText()).toBe(protectedTitle);
  await expect(
    page.locator("#video-title [data-ss-original-title]"),
  ).toBeHidden();
  await expect(
    page.locator("#video-title [data-ss-original-title]"),
  ).toHaveAttribute("aria-hidden", "true");
  expect(
    await page
      .locator("#video-title [data-ss-original-title]")
      .evaluate((element) => (element as HTMLElement).inert),
  ).toBe(true);
  expect(
    await page
      .locator("#thumbnail")
      .evaluate((element) => getComputedStyle(element).filter),
  ).toBe("blur(32px)");
  await expect(page.locator("#thumbnail")).toHaveAttribute(
    "alt",
    "Spoilence protected thumbnail",
  );
  await expect(page.locator("#thumbnail")).toHaveAttribute(
    "title",
    "Spoilence protected thumbnail",
  );
  for (const selector of ["#protected-card", "#video-title"]) {
    await expect(page.locator(selector)).toHaveAttribute(
      "title",
      protectedTitle,
    );
    await expect(page.locator(selector)).toHaveAttribute(
      "aria-label",
      protectedTitle,
    );
  }
  await expect(card).not.toHaveAttribute("aria-labelledby");
  await expect(card).not.toHaveAttribute("aria-describedby");
  for (const [selector, text] of [
    ["#duration", "12:34"],
    ["#channel-name", "Calm Studio"],
    ["#views", "81K views"],
    ["#published", "2 days ago"],
  ]) {
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator(selector)).toHaveText(text);
    expect(
      await page
        .locator(selector)
        .evaluate((element) => getComputedStyle(element).filter),
    ).toBe("none");
  }
  await preferences(page, { enabled: false });
  await expect(page.locator("#video-title")).toHaveText(
    "GTA VI fictional ending",
  );
  await expect(page.locator("#description")).toHaveText("A synthetic fixture.");
  await expect(page.locator("#video-title")).toHaveAttribute(
    "title",
    "GTA VI fictional ending title",
  );
  await expect(page.locator("#video-title")).toHaveAttribute(
    "aria-label",
    "GTA VI fictional ending title",
  );
  await expect(card).toHaveAttribute("aria-labelledby", "video-title");
  await expect(card).toHaveAttribute("aria-describedby", "description");
  await expect(card).toHaveAttribute(
    "aria-label",
    "GTA VI fictional ending card",
  );
  await expect(page.locator("#thumbnail")).toHaveAttribute(
    "alt",
    "GTA VI fictional ending thumbnail",
  );
  expect(
    await page
      .locator("#thumbnail")
      .evaluate((element) => getComputedStyle(element).filter),
  ).toBe("brightness(0.8)");
  expect(
    await page
      .locator("#thumbnail")
      .evaluate((element) => getComputedStyle(element).clipPath),
  ).toBe("none");
  expect(
    await page
      .locator("#thumbnail")
      .evaluate((element) => (element as HTMLElement).style.cssText),
  ).toBe(originalThumbnailStyle);
  expect(
    await page
      .locator("#thumbnail")
      .evaluate((element) => (element as HTMLElement).inert),
  ).toBe(false);
  await expect(
    page.locator("[data-ss-owned],[data-ss-original-title]"),
  ).toHaveCount(0);
});

test("Blur reveal survives unrelated insertion and recycled titles can become protected then safe", async ({
  page,
}) => {
  await boot(page, "www.youtube.com", richCard());
  await preferences(page, { mode: "blur" });
  const card = page.locator("#protected-card");
  await expect(card).toHaveAttribute("data-ss-state", "blur");
  await page.locator("[data-ss-reveal]").click();
  await expect(card).not.toHaveAttribute("data-ss-state");
  await expect(page.locator("#video-title")).toHaveText(
    "GTA VI fictional ending",
  );
  await page.evaluate(() => {
    const safe = document.createElement("ytd-video-renderer");
    safe.textContent = "Gardening advice";
    document.body.append(safe);
  });
  await expect(page.locator("ytd-video-renderer").last()).toHaveAttribute(
    "data-ss-state",
    "allowed",
  );
  await expect(card).not.toHaveAttribute("data-ss-state");
  await page.locator("#video-title").evaluate((element) => {
    element.textContent = "GTA VI fictional betrayal";
  });
  await expect(card).toHaveAttribute("data-ss-state", "blur");
  expect(await page.locator("#video-title").innerText()).toBe(protectedTitle);
  await expect(page.locator("[data-ss-reveal]")).toHaveCount(1);
  await page.evaluate(() => {
    const title = document.querySelector("#video-title")!;
    title.textContent = "Gardening guide";
    title.setAttribute("title", "Gardening guide");
    title.setAttribute("aria-label", "Gardening guide");
    const card = document.querySelector("#protected-card")!;
    card.setAttribute("title", "Gardening guide");
    card.setAttribute("aria-label", "Gardening guide");
    const image = document.querySelector("#thumbnail")!;
    image.setAttribute("alt", "A garden");
    image.setAttribute("title", "A garden");
  });
  await expect(card).toHaveAttribute("data-ss-state", "allowed");
  await expect(page.locator("#video-title")).toHaveText("Gardening guide");
  await expect(page.locator("#video-title")).toHaveAttribute(
    "title",
    "Gardening guide",
  );
  await expect(page.locator("#thumbnail")).toHaveAttribute("alt", "A garden");
  expect(
    await page
      .locator("#thumbnail")
      .evaluate((element) => getComputedStyle(element).filter),
  ).toBe("brightness(0.8)");
  expect(
    await page
      .locator("#thumbnail")
      .evaluate((element) => getComputedStyle(element).clipPath),
  ).toBe("none");
  await expect(
    page.locator("[data-ss-owned],[data-ss-original-title]"),
  ).toHaveCount(0);
});
test("Blur preserves unmapped metadata and centers a transparent Reveal Content host over the thumbnail", async ({
  page,
  context,
  browserName,
}) => {
  const body = richCard().replace(
    "</ytd-video-renderer>",
    '<div class="unmapped-layout"><span id="unmapped-views">43,210 views</span><span id="unmapped-time">7 hours ago</span><a id="unmapped-channel" href="/@independent">Independent channel</a></div></ytd-video-renderer>',
  );
  await boot(page, "www.youtube.com", body);
  await preferences(page, { mode: "blur" });
  const card = page.locator("#protected-card");
  await expect(card).toHaveAttribute("data-ss-state", "blur");
  await expect(card).toBeVisible();
  for (const [selector, text] of [
    ["#unmapped-views", "43,210 views"],
    ["#unmapped-time", "7 hours ago"],
    ["#unmapped-channel", "Independent channel"],
  ]) {
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator(selector)).toHaveText(text);
    expect(
      await page.locator(selector).evaluate((element) => ({
        opacity: getComputedStyle(element).opacity,
        filter: getComputedStyle(element).filter,
        inert: (element as HTMLElement).inert,
      })),
    ).toEqual({ opacity: "1", filter: "none", inert: false });
  }
  await expect(page.locator("#thumbnail")).toHaveCSS("filter", "blur(32px)");
  const host = page.locator("[data-ss-reveal]");
  await expect(host).toHaveCount(1);
  await expect(host).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const mediaBox = (await page.locator("#thumbnail").boundingBox())!;
  const revealBox = (await host.boundingBox())!;
  expect(
    Math.abs(
      revealBox.x + revealBox.width / 2 - mediaBox.x - mediaBox.width / 2,
    ),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      revealBox.y + revealBox.height / 2 - mediaBox.y - mediaBox.height / 2,
    ),
  ).toBeLessThanOrEqual(1);
  expect(Math.abs(revealBox.width - mediaBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(revealBox.height - mediaBox.height)).toBeLessThanOrEqual(1);
  await expect(host).toHaveCSS("pointer-events", "auto");
  if (browserName === "chromium") {
    const session = await context.newCDPSession(page);
    const tree = await session.send("Accessibility.getFullAXTree");
    const button = tree.nodes.find(
      (node) =>
        !node.ignored &&
        node.role?.value === "button" &&
        node.name?.value === "Reveal Content",
    );
    expect(button?.backendDOMNodeId).toBeTruthy();
    const { model } = await session.send("DOM.getBoxModel", {
      backendNodeId: button!.backendDOMNodeId!,
    });
    const buttonCenter = {
      x: (model.border[0] + model.border[4]) / 2,
      y: (model.border[1] + model.border[5]) / 2,
    };
    expect(
      Math.abs(buttonCenter.x - mediaBox.x - mediaBox.width / 2),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(buttonCenter.y - mediaBox.y - mediaBox.height / 2),
    ).toBeLessThanOrEqual(1);
    await session.detach();
  }
  await card.evaluate((element) => {
    element.addEventListener('click', () => { element.setAttribute('data-site-clicked', 'yes'); });
    element.querySelector('[data-ss-reveal]')?.remove();
  });
  await expect(host).toHaveCount(1);
  await host.click();
  await expect(card).not.toHaveAttribute('data-site-clicked');
  await expect(card).not.toHaveAttribute("data-ss-state");
  await expect(page.locator("#video-title")).toHaveText(
    "GTA VI fictional ending",
  );
});

test("title-only Blur keeps a deliberate Reveal control reachable", async ({
  page,
}) => {
  await boot(
    page,
    "www.youtube.com",
    '<ytd-comment-thread-renderer style="display:block"><h2>GTA VI fictional ending</h2></ytd-comment-thread-renderer>',
  );
  await preferences(page, { mode: "blur" });
  const card = page.locator("ytd-comment-thread-renderer");
  await expect(card).toHaveAttribute("data-ss-state", "blur");
  await expect(page.locator("[data-ss-replacement-title]")).toHaveText(
    protectedTitle,
  );
  await expect(page.locator("[data-ss-reveal]")).toHaveCount(1);
  await page.locator("[data-ss-reveal]").click();
  await expect(card).not.toHaveAttribute("data-ss-state");
  await expect(page.locator("h2")).toHaveText("GTA VI fictional ending");
  await expect(page.locator("h2")).toBeVisible();
});

test("metadata-only changes and plain text cards are classified", async ({
  page,
}) => {
  await boot(
    page,
    "www.youtube.com",
    '<ytd-video-renderer aria-label="Gardening">Sample</ytd-video-renderer>',
  );
  await expect(page.locator("ytd-video-renderer")).toHaveAttribute(
    "data-ss-state",
    "allowed",
  );
  await page
    .locator("ytd-video-renderer")
    .evaluate((el) => el.setAttribute("aria-label", "GTA VI fictional finale"));
  await expect(page.locator("ytd-video-renderer")).toHaveAttribute(
    "data-ss-state",
    "hide",
  );
  await preferences(page, { enabled: false });
  await expect(page.locator("ytd-video-renderer")).toHaveText("Sample");
});
test("detached protected cards restore before OFF and can be reinserted", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    (window as any).removedFixture = document.querySelector(
      "ytd-rich-item-renderer",
    );
    (window as any).removedFixture.remove();
  });
  await preferences(page, { enabled: false });
  await page.evaluate(() =>
    document.body.append((window as any).removedFixture),
  );
  await expect(page.locator("h2")).toBeVisible();
  expect(
    await page.locator("h2").evaluate((el) => (el as HTMLElement).inert),
  ).toBe(false);
  expect(
    await page.locator("h2").evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
});
test("changed Instagram link selectors release safely", async ({ page }) => {
  await boot(
    page,
    "www.instagram.com",
    '<main><a href="/p/synthetic"><span>GTA VI fictional ending</span></a></main>',
  );
  await expect(page.locator("main>a")).toHaveAttribute("data-ss-state", "hide");
  await page
    .locator("main>a")
    .evaluate((el) => el.setAttribute("href", "/unsupported"));
  await expect(page.locator("main>a")).not.toHaveAttribute("data-ss-state");
  await expect(page.locator("span")).toBeVisible();
});
test("changed TikTok selector attributes restore original children", async ({
  page,
}) => {
  await boot(
    page,
    "www.tiktok.com",
    '<div data-e2e="recommend-list-item-container"><h2>GTA VI fictional ending</h2></div>',
  );
  await expect(page.locator("[data-e2e]")).toHaveAttribute(
    "data-ss-state",
    "hide",
  );
  await page
    .locator("[data-e2e]")
    .evaluate((el) => el.setAttribute("data-e2e", "unsupported-layout"));
  await expect(page.locator("[data-e2e]")).not.toHaveAttribute("data-ss-state");
  await expect(page.locator("h2")).toBeVisible();
});
test("independent startup guard releases initial cards when detector bundle is absent", async ({
  page,
}) => {
  await page.setContent(
    `<style>${css}</style><ytd-video-renderer>Fictional startup fallback</ytd-video-renderer>`,
  );
  expect(
    await page
      .locator("ytd-video-renderer")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("0");
  await page.addScriptTag({ content: startupGuard });
  await expect(page.locator("ytd-video-renderer")).toBeVisible({
    timeout: 6500,
  });
  await expect
    .poll(
      () =>
        page
          .locator("ytd-video-renderer")
          .evaluate((el) => getComputedStyle(el).opacity),
      {
        timeout: 6500,
      },
    )
    .toBe("1");
});
