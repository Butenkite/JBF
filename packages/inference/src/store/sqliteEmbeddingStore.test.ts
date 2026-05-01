import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SqliteEmbeddingStore } from "./sqliteEmbeddingStore.js";

function unit(values: number[]): Float32Array {
  const v = Float32Array.from(values);
  let s = 0;
  for (const x of v) s += x * x;
  const n = Math.sqrt(s);
  for (let i = 0; i < v.length; i++) v[i]! /= n;
  return v;
}

describe("SqliteEmbeddingStore", () => {
  let tmp: string;
  let store: SqliteEmbeddingStore;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "jbf-emb-"));
    store = new SqliteEmbeddingStore(join(tmp, "test.db"));
  });

  afterEach(() => {
    store.close();
    rmSync(tmp, { recursive: true, force: true });
  });

  it("starts empty and inserts/retrieves rows", () => {
    expect(store.count()).toBe(0);
    store.insert({
      id: "row-1",
      createdAt: 1,
      vector: unit([1, 0, 0]),
      embeddingModelId: "test-model",
      jdTextHash: "hash-1",
      jdPreview: "first jd",
      company: "Acme",
      roleTitle: "Engineer",
      tailorOutputVersion: "1",
      rationaleHash: null,
      artifactPath: null,
    });
    expect(store.count()).toBe(1);
    const found = store.findByHash("hash-1", "test-model");
    expect(found?.id).toBe("row-1");
    expect(found?.company).toBe("Acme");
  });

  it("findBestSimilar returns the highest-scoring row at or above threshold", () => {
    const rows = [
      { id: "a", v: unit([1, 0, 0]) },
      { id: "b", v: unit([0.9, 0.1, 0]) },
      { id: "c", v: unit([0, 1, 0]) },
    ];
    for (const r of rows) {
      store.insert({
        id: r.id,
        createdAt: 1,
        vector: r.v,
        embeddingModelId: "m",
        jdTextHash: r.id,
        jdPreview: r.id,
        company: null,
        roleTitle: null,
        tailorOutputVersion: null,
        rationaleHash: null,
        artifactPath: null,
      });
    }
    const query = unit([1, 0, 0]);
    const best = store.findBestSimilar(query, 0.5, "m");
    expect(best?.row.id).toBe("a");
    expect(best?.score).toBeCloseTo(1, 6);
  });

  it("findBestSimilar returns null when nothing meets the threshold", () => {
    store.insert({
      id: "a",
      createdAt: 1,
      vector: unit([0, 1, 0]),
      embeddingModelId: "m",
      jdTextHash: "a",
      jdPreview: "a",
      company: null,
      roleTitle: null,
      tailorOutputVersion: null,
      rationaleHash: null,
      artifactPath: null,
    });
    const query = unit([1, 0, 0]);
    expect(store.findBestSimilar(query, 0.5, "m")).toBeNull();
  });

  it("ignores rows from a different embedding model", () => {
    store.insert({
      id: "a",
      createdAt: 1,
      vector: unit([1, 0, 0]),
      embeddingModelId: "old-model",
      jdTextHash: "a",
      jdPreview: "a",
      company: null,
      roleTitle: null,
      tailorOutputVersion: null,
      rationaleHash: null,
      artifactPath: null,
    });
    const query = unit([1, 0, 0]);
    expect(store.findBestSimilar(query, 0.5, "new-model")).toBeNull();
  });

  it("re-opening the DB preserves rows (migration is idempotent)", () => {
    store.insert({
      id: "a",
      createdAt: 1,
      vector: unit([1, 0, 0]),
      embeddingModelId: "m",
      jdTextHash: "a",
      jdPreview: "a",
      company: null,
      roleTitle: null,
      tailorOutputVersion: null,
      rationaleHash: null,
      artifactPath: null,
    });
    const dbPath = join(tmp, "test.db");
    store.close();
    const reopened = new SqliteEmbeddingStore(dbPath);
    expect(reopened.count()).toBe(1);
    reopened.close();
    store = new SqliteEmbeddingStore(dbPath);
  });
});
