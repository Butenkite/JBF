export * from "./types.js";
export * from "./config.js";
export { buildCanonicalInput, normalizeJdText } from "./text/normalize.js";
export { chunkText } from "./text/chunk.js";
export { cosine, dot } from "./similarity/cosine.js";
export type { EmbeddingProvider } from "./embeddings/embeddingProvider.js";
export {
  TransformersJsProvider,
  type TransformersJsProviderOptions,
} from "./embeddings/transformersJsProvider.js";
export {
  SqliteEmbeddingStore,
  type InsertEmbeddingInput,
} from "./store/sqliteEmbeddingStore.js";
export { findSimilar } from "./findSimilar.js";
export { registerTailored } from "./registerTailored.js";
export { sha256Hex } from "./hash.js";
