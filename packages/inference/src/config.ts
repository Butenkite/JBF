export interface InferenceEmbeddingConfig {
  modelId: string;
  dimension: number;
  chunkSize: number;
  chunkOverlap: number;
  cacheDir?: string;
}

export interface InferenceConfig {
  embedding: InferenceEmbeddingConfig;
  cacheDbPath: string;
  reuseThreshold: number;
}

export const DEFAULT_INFERENCE_CONFIG: InferenceConfig = {
  embedding: {
    modelId: "Xenova/all-MiniLM-L6-v2",
    dimension: 384,
    chunkSize: 1500,
    chunkOverlap: 150,
  },
  cacheDbPath: "./artifacts/embeddings.db",
  reuseThreshold: 0.88,
};
