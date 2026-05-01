import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk.js";

describe("chunkText", () => {
  it("returns [] for empty input", () => {
    expect(chunkText("", { chunkSize: 100, chunkOverlap: 0 })).toEqual([]);
  });

  it("returns the whole input when shorter than chunkSize", () => {
    expect(chunkText("hello", { chunkSize: 100, chunkOverlap: 10 })).toEqual(["hello"]);
  });

  it("splits long inputs with overlap and covers the entire string", () => {
    const text = "abcdefghijklmnop"; // 16 chars
    const chunks = chunkText(text, { chunkSize: 6, chunkOverlap: 2 });
    expect(chunks).toEqual(["abcdef", "efghij", "ijklmn", "mnop"]);
    expect(chunks.join("").length).toBeGreaterThanOrEqual(text.length);
    expect(chunks[0]!.startsWith("a")).toBe(true);
    expect(chunks[chunks.length - 1]!.endsWith("p")).toBe(true);
  });

  it("handles zero overlap", () => {
    const chunks = chunkText("abcdefghij", { chunkSize: 4, chunkOverlap: 0 });
    expect(chunks).toEqual(["abcd", "efgh", "ij"]);
  });

  it("clamps overlap below chunkSize", () => {
    const chunks = chunkText("abcdefgh", { chunkSize: 4, chunkOverlap: 99 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("rejects non-positive chunkSize", () => {
    expect(() => chunkText("abc", { chunkSize: 0, chunkOverlap: 0 })).toThrow();
  });
});
