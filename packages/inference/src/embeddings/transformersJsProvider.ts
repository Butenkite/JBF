import type { EmbeddingProvider } from "./embeddingProvider.js";
import { chunkText } from "../text/chunk.js";

const DEFAULT_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const DEFAULT_DIMENSION = 384;

export interface TransformersJsProviderOptions {
  modelId?: string;
  dimension?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  cacheDir?: string;
  allowRemoteModels?: boolean;
}

type FeatureExtractionPipeline = (
  text: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

export class TransformersJsProvider implements EmbeddingProvider {
  readonly modelId: string;
  readonly dimension: number;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly cacheDir?: string;
  private readonly allowRemoteModels: boolean;
  private pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

  constructor(options: TransformersJsProviderOptions = {}) {
    this.modelId = options.modelId ?? DEFAULT_MODEL_ID;
    this.dimension = options.dimension ?? DEFAULT_DIMENSION;
    this.chunkSize = options.chunkSize ?? 1500;
    this.chunkOverlap = options.chunkOverlap ?? 150;
    this.cacheDir = options.cacheDir;
    this.allowRemoteModels = options.allowRemoteModels ?? true;
  }

  async embed(text: string): Promise<Float32Array> {
    if (typeof text !== "string" || text.length === 0) {
      throw new Error("Cannot embed empty text");
    }
    const pipeline = await this.getPipeline();
    const chunks = chunkText(text, {
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });
    if (chunks.length === 1) {
      const out = await pipeline(chunks[0]!, { pooling: "mean", normalize: true });
      return assertDim(toFloat32(out.data), this.dimension);
    }

    const vectors: Float32Array[] = [];
    for (const c of chunks) {
      const out = await pipeline(c, { pooling: "mean", normalize: true });
      vectors.push(assertDim(toFloat32(out.data), this.dimension));
    }
    return l2Normalize(meanPool(vectors, this.dimension));
  }

  async embedMany(texts: string[]): Promise<Float32Array[]> {
    const out: Float32Array[] = [];
    for (const t of texts) out.push(await this.embed(t));
    return out;
  }

  private async getPipeline(): Promise<FeatureExtractionPipeline> {
    if (!this.pipelinePromise) {
      this.pipelinePromise = (async () => {
        const tx = await import("@xenova/transformers");
        if (this.cacheDir) tx.env.cacheDir = this.cacheDir;
        tx.env.allowRemoteModels = this.allowRemoteModels;
        const p = await tx.pipeline("feature-extraction", this.modelId);
        return p as unknown as FeatureExtractionPipeline;
      })();
    }
    return this.pipelinePromise;
  }
}

function toFloat32(data: Float32Array | number[]): Float32Array {
  return data instanceof Float32Array ? data : Float32Array.from(data);
}

function assertDim(v: Float32Array, expected: number): Float32Array {
  if (v.length !== expected) {
    throw new Error(`Embedding dimension mismatch: expected ${expected}, got ${v.length}`);
  }
  return v;
}

function meanPool(vectors: Float32Array[], dim: number): Float32Array {
  const acc = new Float32Array(dim);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) acc[i]! += v[i]!;
  }
  const n = vectors.length;
  for (let i = 0; i < dim; i++) acc[i]! /= n;
  return acc;
}

function l2Normalize(v: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i]! * v[i]!;
  const norm = Math.sqrt(sum);
  if (norm === 0) return v;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i]! / norm;
  return out;
}
