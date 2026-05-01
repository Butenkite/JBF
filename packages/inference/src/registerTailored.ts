import type { EmbeddingProvider } from "./embeddings/embeddingProvider.js";
import type { SqliteEmbeddingStore } from "./store/sqliteEmbeddingStore.js";
import type { RegisterTailoredInput, TailoredEmbeddingRow } from "./types.js";
import { buildCanonicalInput } from "./text/normalize.js";
import { newId, sha256Hex } from "./hash.js";

const PREVIEW_CHARS = 240;

export async function registerTailored(
  input: RegisterTailoredInput,
  deps: { provider: EmbeddingProvider; store: SqliteEmbeddingStore },
): Promise<TailoredEmbeddingRow> {
  const canonical = buildCanonicalInput({
    jdText: input.jdText,
    company: input.company,
    roleTitle: input.roleTitle,
  });
  if (canonical.length === 0) {
    throw new Error("Cannot register an empty job description");
  }

  const vector = await deps.provider.embed(canonical);
  const id = newId();
  const createdAt = Date.now();
  const jdTextHash = sha256Hex(canonical);
  const jdPreview = canonical.slice(0, PREVIEW_CHARS);

  deps.store.insert({
    id,
    createdAt,
    vector,
    embeddingModelId: deps.provider.modelId,
    jdTextHash,
    jdPreview,
    company: input.company ?? null,
    roleTitle: input.roleTitle ?? null,
    tailorOutputVersion: input.tailorOutputVersion ?? null,
    rationaleHash: input.rationaleHash ?? null,
    artifactPath: input.artifactPath ?? null,
  });

  return {
    id,
    createdAt,
    embeddingModelId: deps.provider.modelId,
    jdTextHash,
    jdPreview,
    company: input.company ?? null,
    roleTitle: input.roleTitle ?? null,
    tailorOutputVersion: input.tailorOutputVersion ?? null,
    rationaleHash: input.rationaleHash ?? null,
    artifactPath: input.artifactPath ?? null,
  };
}
