import type { EmbeddingProvider } from "./embeddings/embeddingProvider.js";
import type { SqliteEmbeddingStore } from "./store/sqliteEmbeddingStore.js";
import type { FindSimilarInput, SimilarityMatch } from "./types.js";
import { buildCanonicalInput } from "./text/normalize.js";

export async function findSimilar(
  input: FindSimilarInput,
  deps: {
    provider: EmbeddingProvider;
    store: SqliteEmbeddingStore;
    defaultThreshold: number;
  },
): Promise<SimilarityMatch | null> {
  const canonical = buildCanonicalInput({
    jdText: input.jdText,
    company: input.company,
    roleTitle: input.roleTitle,
  });
  if (canonical.length === 0) return null;

  const threshold = input.threshold ?? deps.defaultThreshold;
  const vector = await deps.provider.embed(canonical);
  return deps.store.findBestSimilar(vector, threshold, deps.provider.modelId);
}
