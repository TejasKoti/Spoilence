import { describe, expect, it } from "vitest";
import {
  classifyText,
  normalizeText,
} from "../../backend/packages/rule-engine/src/index.js";
import { shouldConceal } from "../../backend/packages/decision-engine/src/index.js";
import {
  DEFAULT_SETTINGS,
  parseSettings,
} from "../../backend/packages/settings-schema/src/index.js";
import { bundledRules } from "../../backend/packages/rule-packs/src/index.js";
import {
  validateRulePack,
  verifyRuleImport,
} from "../../backend/tools/rule-validation/index.js";

describe("normalization and policy", () => {
  it("normalizes unicode, separators and obfuscation without exposing input in assertions", () => {
    expect(
      normalizeText("G.T.A.６ \u200b ＥＮＤＩＮＧ") === "gta 6 ending",
    ).toBe(true);
    expect(classifyText("GT\u0430 6 ending").decision).toBe("BLOCK");
  });
  it("preserves deterministic results and safe reason enums", () => {
    const first = classifyText("GTA VI ending synthetic case");
    expect(first).toEqual(classifyText("GTA VI ending synthetic case"));
    expect(Object.keys(first).sort()).toEqual([
      "confidence",
      "decision",
      "reason",
      "ruleVersion",
    ]);
  });
  it("applies aggressive, balanced and custom policies plus OFF", () => {
    const uncertain = classifyText("GTA VI hardware");
    expect(shouldConceal(uncertain, parseSettings({}))).toBe(true);
    expect(
      shouldConceal(uncertain, parseSettings({ sensitivity: "balanced" })),
    ).toBe(false);
    expect(
      shouldConceal(
        uncertain,
        parseSettings({ sensitivity: "custom", customThreshold: 0.7 }),
      ),
    ).toBe(false);
    expect(
      shouldConceal(
        uncertain,
        parseSettings({ sensitivity: "custom", customThreshold: 0.6 }),
      ),
    ).toBe(true);
    expect(
      shouldConceal(
        classifyText("GTA 6 ending"),
        parseSettings({ enabled: false }),
      ),
    ).toBe(false);
  });
});
describe("settings boundary", () => {
  it("merges nested site defaults with validated preferences", () => {
    const parsed = parseSettings({ sites: { youtube: false }, mode: "blur" });
    expect(parsed.sites).toEqual({
      youtube: false,
      instagram: true,
      tiktok: true,
    });
    expect(parsed.mode).toBe("blur");
    expect(DEFAULT_SETTINGS.sites.youtube).toBe(true);
    expect(DEFAULT_SETTINGS.mode).toBe("blur");
  });
  it("rejects user content and malformed preferences", () => {
    for (const value of [
      null,
      [],
      { title: "synthetic" },
      { schemaVersion: 2 },
      { sites: { youtube: "yes" } },
      { sites: { unknown: true } },
      { customThreshold: NaN },
      { customThreshold: 2 },
      { enabled: 1 },
      { mode: "transparent" },
    ])
      expect(() => parseSettings(value)).toThrow("Invalid settings");
  });
});
describe("manual data-only rule imports", () => {
  it("requires matching independent SHA256 and returns immutable data", async () => {
    const text = JSON.stringify(bundledRules);
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    );
    const hex = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    const imported = await verifyRuleImport(text, hex);
    expect(imported.version).toBe(bundledRules.version);
    expect(Object.isFrozen(imported.aliases)).toBe(true);
    await expect(verifyRuleImport(text, "0".repeat(64))).rejects.toThrow(
      "Rule integrity mismatch",
    );
  });
  it("rejects executable and unknown fields, oversize packs and malformed schemas", async () => {
    expect(() =>
      validateRulePack({ ...bundledRules, script: "synthetic" }),
    ).toThrow("Invalid rule pack");
    expect(() =>
      validateRulePack({ ...bundledRules, aliases: [null] }),
    ).toThrow("Invalid rule pack");
    expect(() =>
      validateRulePack({ ...bundledRules, version: "next" }),
    ).toThrow("Invalid rule pack");
    await expect(
      verifyRuleImport("x".repeat(128 * 1024 + 1), "0".repeat(64)),
    ).rejects.toThrow("Invalid rule import");
  });
});
