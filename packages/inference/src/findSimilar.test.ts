import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { EmbeddingProvider } from "./embeddings/embeddingProvider.js";
import { findSimilar } from "./findSimilar.js";
import { registerTailored } from "./registerTailored.js";
import { SqliteEmbeddingStore } from "./store/sqliteEmbeddingStore.js";

class StubProvider implements EmbeddingProvider {
  readonly modelId = "stub";
  readonly dimension = 3;
  constructor(private readonly map: (text: string) => Float32Array) {}
  async embed(text: string): Promise<Float32Array> {
    return this.map(text);
  }
  async embedMany(texts: string[]): Promise<Float32Array[]> {
    return texts.map(this.map);
  }
}

function unit(values: number[]): Float32Array {
  const v = Float32Array.from(values);
  let s = 0;
  for (const x of v) s += x * x;
  const n = Math.sqrt(s);
  for (let i = 0; i < v.length; i++) v[i]! /= n;
  return v;
}

describe("findSimilar / registerTailored", () => {
  let tmp: string;
  let store: SqliteEmbeddingStore;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "jbf-fs-"));
    store = new SqliteEmbeddingStore(join(tmp, "fs.db"));
  });

  afterEach(() => {
    store.close();
    rmSync(tmp, { recursive: true, force: true });
  });

  it("returns null on an empty JD", async () => {
    const provider = new StubProvider(() => unit([1, 0, 0]));
    const result = await findSimilar(
      { jdText: "" },
      { provider, store, defaultThreshold: 0.5 },
    );
    expect(result).toBeNull();
  });

  it("registers then finds an exact-match JD", async () => {
    const provider = new StubProvider((text) =>
      text.includes("frontend") ? unit([1, 0, 0]) : unit([0, 1, 0]),
    );
    await registerTailored(
      { jdText: "Frontend role at Acme", company: "Acme", roleTitle: "Frontend" },
      { provider, store },
    );
    const match = await findSimilar(
      { jdText: "Frontend role at Acme" },
      { provider, store, defaultThreshold: 0.8 },
    );
    expect(match).not.toBeNull();
    expect(match?.score).toBeCloseTo(1, 6);
    expect(match?.row.company).toBe("Acme");
  });

  it("returns null when below threshold", async () => {
    const provider = new StubProvider((text) =>
      text.includes("frontend") ? unit([1, 0, 0]) : unit([0, 1, 0]),
    );
    await registerTailored({ jdText: "Frontend role" }, { provider, store });
    const match = await findSimilar(
      { jdText: "Backend systems work" },
      { provider, store, defaultThreshold: 0.5 },
    );
    expect(match).toBeNull();
  });

  it("threshold boundary: just above passes, just below fails", async () => {
    const A = unit([1, 0, 0]);
    const B = unit([0.95, Math.sqrt(1 - 0.95 * 0.95), 0]);
    const provider = new StubProvider((text) => (text.includes("a") ? A : B));
    await registerTailored({ jdText: "a-jd" }, { provider, store });

    const score = A[0]! * B[0]! + A[1]! * B[1]! + A[2]! * B[2]!;
    const justBelow = await findSimilar(
      { jdText: "b-jd", threshold: score + 0.01 },
      { provider, store, defaultThreshold: 0 },
    );
    expect(justBelow).toBeNull();

    const justAbove = await findSimilar(
      { jdText: "b-jd", threshold: score - 0.01 },
      { provider, store, defaultThreshold: 0 },
    );
    expect(justAbove).not.toBeNull();
  });

  it("registerTailored rejects empty input", async () => {
    const provider = new StubProvider(() => unit([1, 0, 0]));
    await expect(
      registerTailored({ jdText: "" }, { provider, store }),
    ).rejects.toThrow();
  });
});
