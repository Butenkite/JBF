import type { MasterBullet, MasterExperienceRole, MasterResume, MasterSection } from "./master-resume.js";
import { bulletIdSchema } from "./bulletRefs.js";

export type ParseMasterResumeResult =
  | { ok: true; value: MasterResume }
  | { ok: false; error: string };

function slugify(title: string): string {
  const lower = title.toLowerCase();
  let out = "";
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i]!;
    const code = c.charCodeAt(0);
    const alnum = (code >= 48 && code <= 57) || (code >= 97 && code <= 122);
    if (alnum)
      out += c;

    else if (out.length > 0 && !out.endsWith("-"))
      out += "-";
  }

  while (out.startsWith("-"))
    out = out.slice(1);

  while (out.endsWith("-"))
    out = out.slice(0, -1);

  return out.length > 0 ? out : "section";
}

function parseRoleLine(rest: string): { title: string; roleId?: string } {
  const trimmed = rest.trim();
  const tag = "<!-- id:";
  const tagStart = trimmed.lastIndexOf(tag);
  if (tagStart === -1)
    return { title: trimmed };

  const beforeTag = trimmed.slice(0, tagStart).trim();
  const fromTag = trimmed.slice(tagStart + tag.length);
  const gt = fromTag.indexOf("-->");
  if (gt === -1)
    return { title: trimmed };

  const idCandidate = fromTag.slice(0, gt).trim();
  const idParsed = bulletIdSchema.safeParse(idCandidate);
  if (!idParsed.success)
    return { title: trimmed };

  return {
    title: beforeTag.length > 0 ? beforeTag : trimmed,
    roleId: idParsed.data,
  };
}

function parseH2Title(line: string): string | null {
  const t = line.trimStart();
  if (!t.startsWith("## "))
    return null;

  if (t.startsWith("### "))
    return null;

  return t.slice(3).trim();
}

function parseH3Title(line: string): string | null {
  const t = line.trimStart();
  if (!t.startsWith("### "))
    return null;

  if (t.startsWith("#### "))
    return null;

  return t.slice(4).trim();
}

function registerId(
  registry: Map<string, string>,
  id: string,
  origin: string,
): ParseMasterResumeResult | null {
  if (registry.has(id))
    return {
      ok: false,
      error: `Duplicate id '${id}' (already used for ${registry.get(id)}) near ${origin}.`,
    };

  registry.set(id, origin);
  return null;
}

type BulletParse =
  | { ok: true; bullet: MasterBullet }
  | { ok: false; error: string };

function parseSkillOrExperienceBullet(line: string, originLabel: string): BulletParse {
  const t = line.trimStart();
  if (!t.startsWith("- "))
    return {
      ok: false,
      error: `${originLabel}: each bullet must be \`- <!-- id: your-id --> Text\`.`,
    };

  let rest = t.slice(2).trimStart();
  const marker = "<!-- id:";
  if (!rest.startsWith(marker))
    return {
      ok: false,
      error: `${originLabel}: bullets must declare \`${marker} … -->\`.`,
    };

  rest = rest.slice(marker.length);
  const end = rest.indexOf("-->");
  if (end === -1)
    return {
      ok: false,
      error: `${originLabel}: malformed HTML id tag (missing \`-->\`).`,
    };

  const idRaw = rest.slice(0, end).trim();
  const text = rest.slice(end + 3).trim();
  const parsed = bulletIdSchema.safeParse(idRaw);
  if (!parsed.success)
    return { ok: false, error: `${originLabel}: invalid bullet id ${idRaw}` };

  if (!text)
    return { ok: false, error: `${originLabel}: id '${parsed.data}' has empty bullet text.` };

  return { ok: true, bullet: { id: parsed.data, text } };
}

export function parseMasterResume(content: string): ParseMasterResumeResult {
  const lines = content.split(/\r?\n/);
  const idRegistry = new Map<string, string>();
  const sections: MasterSection[] = [];

  type Mode = "generic" | "skills" | "experience";
  let mode: Mode = "generic";

  let current: MasterSection = {
    slug: "_preface",
    title: "",
    skills: [],
    experienceRoles: [],
    rawBodyLines: [],
  };
  let currentRole: MasterExperienceRole | null = null;

  const pushCurrent = (): void => {
    const hasContent =
      current.title.length > 0
      || current.skills.length > 0
      || current.experienceRoles.length > 0
      || current.rawBodyLines.some((l) => l.trim().length > 0);

    if (hasContent)
      sections.push(current);
  };

  for (const line of lines) {
    const h2Title = parseH2Title(line);
    if (h2Title !== null) {
      pushCurrent();
      const slug = slugify(h2Title);
      current = {
        slug,
        title: h2Title,
        skills: [],
        experienceRoles: [],
        rawBodyLines: [],
      };
      const tl = h2Title.toLowerCase();
      if (tl === "skills")
        mode = "skills";

      else if (tl === "experience")
        mode = "experience";

      else mode = "generic";

      currentRole = null;
      continue;
    }

    const h3Rest = mode === "experience" ? parseH3Title(line) : null;
    if (h3Rest !== null) {
      const role = parseRoleLine(h3Rest);
      currentRole = {
        title: role.title,
        bullets: [],
        ...(role.roleId ? { roleId: role.roleId } : {}),
      };

      current.experienceRoles.push(currentRole);

      if (role.roleId) {
        const err = registerId(idRegistry, role.roleId, `role "${role.title}"`);
        if (err)
          return err;
      }
      continue;
    }

    if (mode === "skills" && line.trimStart().startsWith("-")) {
      const b = parseSkillOrExperienceBullet(line, "Skills");
      if (!b.ok)
        return { ok: false, error: b.error };

      const err = registerId(idRegistry, b.bullet.id, "skills");
      if (err)
        return err;

      current.skills.push(b.bullet);
      continue;
    }

    if (mode === "experience" && line.trimStart().startsWith("-")) {
      if (!currentRole)
        return { ok: false, error: "Experience: add a `### Role` heading before bullets." };

      const b = parseSkillOrExperienceBullet(line, `Experience "${currentRole.title}"`);
      if (!b.ok)
        return { ok: false, error: b.error };

      const err = registerId(
        idRegistry,
        b.bullet.id,
        `bullet under "${currentRole.title}"`,
      );

      if (err)
        return err;

      currentRole.bullets.push(b.bullet);
      continue;
    }

    current.rawBodyLines.push(line);
  }

  pushCurrent();

  return { ok: true, value: { sections } };
}
