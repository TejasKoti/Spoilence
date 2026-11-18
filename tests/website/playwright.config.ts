import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { TEST_ORIGIN, TEST_PORT } from "./test-origin";
export default defineConfig({
  testDir: ".",
  testMatch: "website.spec.ts",
  outputDir: "../results/website",
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: TEST_ORIGIN,
    headless: true,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: {
    command: `node node_modules/wrangler/bin/wrangler.js dev --ip 127.0.0.1 --port ${TEST_PORT}`,
    cwd: fileURLToPath(new URL("../../website/", import.meta.url)),
    url: TEST_ORIGIN,
    timeout: 90000,
    reuseExistingServer: false,
    env: { WRANGLER_SEND_METRICS: "false", NO_COLOR: "1" },
  },
});
