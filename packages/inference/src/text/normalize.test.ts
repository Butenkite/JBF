import { describe, expect, it } from "vitest";
import { buildCanonicalInput, normalizeJdText } from "./normalize.js";

describe("normalizeJdText", () => {
  it("returns empty string for empty or whitespace input", () => {
    expect(normalizeJdText("")).toBe("");
    expect(normalizeJdText("   \n\t ")).toBe("");
  });

  it("collapses whitespace and lowercases by default", () => {
    expect(normalizeJdText("Hello\r\n  World\tNow")).toBe("hello world now");
  });

  it("preserves case when lowercase: false", () => {
    expect(normalizeJdText("Hello World", { lowercase: false })).toBe("Hello World");
  });

  it("is idempotent", () => {
    const once = normalizeJdText("Some\n  Text  Here");
    expect(normalizeJdText(once)).toBe(once);
  });
});

describe("buildCanonicalInput", () => {
  it("emits a stable order: role, company, jd", () => {
    const out = buildCanonicalInput({
      jdText: "Build great software.",
      roleTitle: "Senior Engineer",
      company: "Acme",
    });
    expect(out).toBe("role: senior engineer\ncompany: acme\nbuild great software.");
  });

  it("omits missing optional parts", () => {
    expect(buildCanonicalInput({ jdText: "only jd" })).toBe("only jd");
    expect(buildCanonicalInput({ jdText: "", company: "Acme" })).toBe("company: acme");
  });

  it("returns empty string when nothing is provided", () => {
    expect(buildCanonicalInput({ jdText: "" })).toBe("");
  });
});
