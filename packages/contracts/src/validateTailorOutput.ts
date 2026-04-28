import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ZodIssue } from "zod";
import type { TailorOutputV1 } from "./tailorOutputSchema.js";
import {
  tailorOutputV1Schema,
} from "./tailorOutputSchema.js";

export type TailorValidationResult =
  | { ok: true; value: TailorOutputV1 }
  | { ok: false; errors: string[] };

export function loadTailorOutputSchema(): object {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, "../schemas/tailor-output-v1.json");
  return JSON.parse(readFileSync(path, "utf8")) as object;
}

function formatZodIssues(issues: ZodIssue[]): string[] {
  return issues.map((i) => {
    const path = i.path.length > 0 ? i.path.join(".") : "(root)";
    const msg =
      typeof i.message === "string" && i.message.length > 0
        ? i.message
        : "invalid";
    return `${path}: ${msg}`;
  });
}

export function validateTailorOutputV1(data: unknown): TailorValidationResult {
  const r = tailorOutputV1Schema.safeParse(data);
  if (r.success)
    return { ok: true, value: r.data };

  return {
    ok: false,
    errors: formatZodIssues(r.error.issues),
  };
}
