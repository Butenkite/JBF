import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateTailorOutputV1 } from "./validateTailorOutput.js";

const dir = dirname(fileURLToPath(import.meta.url));

describe("validateTailorOutputV1", () => {
  it("accepts a valid v1 payload", () => {
    const raw = readFileSync(
      join(dir, "__fixtures__", "valid-tailor-v1.json"),
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    const r = validateTailorOutputV1(parsed);
    expect(r.ok).toBe(true);
  });

  it("rejects payloads missing required tailorOutputVersion", () => {
    const raw = readFileSync(
      join(dir, "__fixtures__", "invalid-tailor-missing-version.json"),
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    const r = validateTailorOutputV1(parsed);
    expect(r.ok).toBe(false);
    if (r.ok)
      throw new Error("expected failure");
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("rejects unknown top-level properties", () => {
    const r = validateTailorOutputV1({
      tailorOutputVersion: "1",
      summary: "ok",
      experienceSelections: [],
      skillsOrdering: [],
      extraBad: true,
    });
    expect(r.ok).toBe(false);
  });
});
