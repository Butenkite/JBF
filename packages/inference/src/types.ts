export interface TailoredEmbeddingRow {
  id: string;
  createdAt: number;
  embeddingModelId: string;
  jdTextHash: string;
  jdPreview: string;
  company: string | null;
  roleTitle: string | null;
  tailorOutputVersion: string | null;
  rationaleHash: string | null;
  artifactPath: string | null;
}

export interface SimilarityMatch {
  row: TailoredEmbeddingRow;
  score: number;
}

export interface RegisterTailoredInput {
  jdText: string;
  company?: string;
  roleTitle?: string;
  tailorOutputVersion?: string;
  rationaleHash?: string;
  artifactPath?: string;
}

export interface FindSimilarInput {
  jdText: string;
  company?: string;
  roleTitle?: string;
  threshold?: number;
}
