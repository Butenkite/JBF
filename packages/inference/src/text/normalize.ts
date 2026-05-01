export interface NormalizeOptions {
  lowercase?: boolean;
}

export function normalizeJdText(input: string, options: NormalizeOptions = {}): string {
  const lowercase = options.lowercase ?? true;
  if (typeof input !== "string" || input.length === 0) return "";

  let s = input.replace(/\r\n?/g, "\n");
  s = s.replace(/\s+/g, " ").trim();
  if (lowercase) s = s.toLowerCase();
  return s;
}

export interface CanonicalInputParts {
  jdText: string;
  roleTitle?: string;
  company?: string;
}

export function buildCanonicalInput(parts: CanonicalInputParts): string {
  const jd = normalizeJdText(parts.jdText);
  const role = parts.roleTitle ? normalizeJdText(parts.roleTitle) : "";
  const company = parts.company ? normalizeJdText(parts.company) : "";

  const segments: string[] = [];
  if (role) segments.push(`role: ${role}`);
  if (company) segments.push(`company: ${company}`);
  if (jd) segments.push(jd);
  return segments.join("\n");
}
