export interface EmbeddingProvider {
  readonly modelId: string;
  readonly dimension: number;
  embed(text: string): Promise<Float32Array>;
  embedMany(texts: string[]): Promise<Float32Array[]>;
}
