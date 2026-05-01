export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export function chunkText(input: string, options: ChunkOptions): string[] {
  if (typeof input !== "string" || input.length === 0) return [];
  if (options.chunkSize <= 0) {
    throw new Error(`chunkSize must be > 0, got ${options.chunkSize}`);
  }

  const size = options.chunkSize;
  const overlap = Math.max(0, Math.min(options.chunkOverlap, size - 1));
  if (input.length <= size) return [input];

  const chunks: string[] = [];
  const stride = size - overlap;
  for (let start = 0; start < input.length; start += stride) {
    const end = Math.min(start + size, input.length);
    chunks.push(input.slice(start, end));
    if (end === input.length) break;
  }
  return chunks;
}
