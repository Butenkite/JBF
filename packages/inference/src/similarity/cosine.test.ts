import { describe, expect, it } from "vitest";
import { cosine, dot } from "./cosine.js";

describe("dot / cosine", () => {
  it("identical normalized vectors have similarity 1", () => {
    const a = unit([1, 2, 3]);
    expect(dot(a, a)).toBeCloseTo(1, 6);
    expect(cosine(a, a)).toBeCloseTo(1, 6);
  });

  it("orthogonal vectors have similarity 0", () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([0, 1]);
    expect(dot(a, b)).toBe(0);
    expect(cosine(a, b)).toBe(0);
  });

  it("opposite vectors have similarity -1", () => {
    const a = unit([1, 0, 0]);
    const b = unit([-1, 0, 0]);
    expect(cosine(a, b)).toBeCloseTo(-1, 6);
  });

  it("returns 0 when one vector is zero", () => {
    const a = new Float32Array([0, 0, 0]);
    const b = new Float32Array([1, 0, 0]);
    expect(cosine(a, b)).toBe(0);
  });

  it("rejects mismatched lengths", () => {
    expect(() => dot(new Float32Array([1, 2]), new Float32Array([1, 2, 3]))).toThrow();
  });
});

function unit(values: number[]): Float32Array {
  const v = Float32Array.from(values);
  let s = 0;
  for (const x of v) s += x * x;
  const n = Math.sqrt(s);
  for (let i = 0; i < v.length; i++) v[i]! /= n;
  return v;
}
