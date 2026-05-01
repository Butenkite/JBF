import Database, { type Database as DatabaseType, type Statement } from "better-sqlite3";
import { dot } from "../similarity/cosine.js";
import type { SimilarityMatch, TailoredEmbeddingRow } from "../types.js";

export interface InsertEmbeddingInput {
  id: string;
  createdAt: number;
  vector: Float32Array;
  embeddingModelId: string;
  jdTextHash: string;
  jdPreview: string;
  company: string | null;
  roleTitle: string | null;
  tailorOutputVersion: string | null;
  rationaleHash: string | null;
  artifactPath: string | null;
}

const SCHEMA_VERSION = 1;

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS tailored_embedding (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    embedding BLOB NOT NULL,
    embedding_model_id TEXT NOT NULL,
    jd_text_hash TEXT NOT NULL,
    jd_preview TEXT NOT NULL,
    company TEXT,
    role_title TEXT,
    tailor_output_version TEXT,
    rationale_hash TEXT,
    artifact_path TEXT
  );
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_tailored_embedding_created_at
    ON tailored_embedding (created_at DESC);
`;

interface RawRow {
  id: string;
  created_at: number;
  embedding: Buffer;
  embedding_model_id: string;
  jd_text_hash: string;
  jd_preview: string;
  company: string | null;
  role_title: string | null;
  tailor_output_version: string | null;
  rationale_hash: string | null;
  artifact_path: string | null;
}

export class SqliteEmbeddingStore {
  private readonly db: DatabaseType;
  private readonly insertStmt: Statement;
  private readonly selectAllStmt: Statement;
  private readonly selectByHashStmt: Statement;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.migrate();

    this.insertStmt = this.db.prepare(`
      INSERT INTO tailored_embedding (
        id, created_at, embedding, embedding_model_id,
        jd_text_hash, jd_preview, company, role_title,
        tailor_output_version, rationale_hash, artifact_path
      ) VALUES (
        @id, @createdAt, @embedding, @embeddingModelId,
        @jdTextHash, @jdPreview, @company, @roleTitle,
        @tailorOutputVersion, @rationaleHash, @artifactPath
      )
    `);
    this.selectAllStmt = this.db.prepare("SELECT * FROM tailored_embedding");
    this.selectByHashStmt = this.db.prepare(
      "SELECT * FROM tailored_embedding WHERE jd_text_hash = ? AND embedding_model_id = ?",
    );
  }

  close(): void {
    this.db.close();
  }

  insert(input: InsertEmbeddingInput): void {
    this.insertStmt.run({
      id: input.id,
      createdAt: input.createdAt,
      embedding: vectorToBuffer(input.vector),
      embeddingModelId: input.embeddingModelId,
      jdTextHash: input.jdTextHash,
      jdPreview: input.jdPreview,
      company: input.company,
      roleTitle: input.roleTitle,
      tailorOutputVersion: input.tailorOutputVersion,
      rationaleHash: input.rationaleHash,
      artifactPath: input.artifactPath,
    });
  }

  findBestSimilar(
    queryVector: Float32Array,
    threshold: number,
    embeddingModelId: string,
  ): SimilarityMatch | null {
    let best: SimilarityMatch | null = null;
    for (const raw of this.selectAllStmt.iterate() as IterableIterator<RawRow>) {
      if (raw.embedding_model_id !== embeddingModelId) continue;
      const v = bufferToVector(raw.embedding);
      if (v.length !== queryVector.length) continue;
      const score = dot(queryVector, v);
      if (score >= threshold && (best === null || score > best.score)) {
        best = { row: rawToRow(raw), score };
      }
    }
    return best;
  }

  findByHash(jdTextHash: string, embeddingModelId: string): TailoredEmbeddingRow | null {
    const raw = this.selectByHashStmt.get(jdTextHash, embeddingModelId) as RawRow | undefined;
    return raw ? rawToRow(raw) : null;
  }

  count(): number {
    const r = this.db.prepare("SELECT COUNT(*) AS n FROM tailored_embedding").get() as {
      n: number;
    };
    return r.n;
  }

  private migrate(): void {
    const current = (this.db.pragma("user_version", { simple: true }) as number) ?? 0;
    if (current < 1) {
      this.db.exec(CREATE_TABLE_SQL);
      this.db.exec(CREATE_INDEX_SQL);
    }
    this.db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }
}

function vectorToBuffer(v: Float32Array): Buffer {
  return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
}

function bufferToVector(buf: Buffer): Float32Array {
  const copy = new ArrayBuffer(buf.byteLength);
  new Uint8Array(copy).set(buf);
  return new Float32Array(copy);
}

function rawToRow(raw: RawRow): TailoredEmbeddingRow {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    embeddingModelId: raw.embedding_model_id,
    jdTextHash: raw.jd_text_hash,
    jdPreview: raw.jd_preview,
    company: raw.company,
    roleTitle: raw.role_title,
    tailorOutputVersion: raw.tailor_output_version,
    rationaleHash: raw.rationale_hash,
    artifactPath: raw.artifact_path,
  };
}
