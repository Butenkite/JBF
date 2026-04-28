import { z } from "zod";

function alnumAscii(c: string): boolean {
  const u = c.charCodeAt(0);
  return (
    (u >= 97 && u <= 122)
    || (u >= 48 && u <= 57)
  ); 
}

function idRestAscii(c: string): boolean {
  const u = c.charCodeAt(0);
  return alnumAscii(c) || u === 45 || u === 95; 
}

export function isValidBulletId(id: string): boolean {
  if (typeof id !== "string" || id.length < 3 || id.length > 64)
    return false;
  const first = id.slice(0, 1);
  if (!alnumAscii(first))
    return false;
  for (let i = 1; i < id.length; i++) {
    const ch = id.slice(i, i + 1);
    if (!idRestAscii(ch))
      return false;
  }
  return true;
}

export const bulletIdSchema = z.string().refine(isValidBulletId, {
  message: "Invalid id (expected lowercase ASCII alphanumeric, hyphen, underscore; length 3–64)",
});
