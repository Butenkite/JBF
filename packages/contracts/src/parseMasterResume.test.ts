import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseMasterResume } from "./parseMasterResume.js";

const dir = dirname(fileURLToPath(import.meta.url));

function readFixture(name: string): string {
  return readFileSync(join(dir, "__fixtures__", name), "utf8");
}

describe("parseMasterResume", () => {
  it("parses sample master including skills and experience bullets", () => {
    const r = parseMasterResume(readFixture("master-sample.md"));
    expect(r.ok).toBe(true);
    if (!r.ok)
      throw new Error(r.error);
    const skills = r.value.sections.find((s) => s.slug === "skills");
    expect(skills?.skills.map((b) => b.id)).toEqual([
      "skill-typescript",
      "skill-nodejs",
    ]);

    const exp = r.value.sections.find((s) => s.slug === "experience");
    expect(exp?.experienceRoles).toHaveLength(1);
    expect(exp?.experienceRoles[0]?.roleId).toBe("role-acme");
    expect(exp?.experienceRoles[0]?.bullets.map((b) => b.id)).toEqual([
      "bull-acme-001",
      "bull-acme-002",
    ]);
  });

  it("rejects duplicate ids across sections", () => {
    const dup = [
      "## Skills",
      "- <!-- id: dup-id --> First",
      "## Experience",
      "### Role A",
      "- <!-- id: dup-id --> Duplicate",
    ].join("\n");
    const r = parseMasterResume(dup);
    expect(r.ok).toBe(false);
  });

  it("rejects bullets before a role heading in Experience", () => {
    const bad = [
      "## Experience",
      "- <!-- id: lone-bull --> orphaned",
    ].join("\n");
    const r = parseMasterResume(bad);
    expect(r.ok).toBe(false);
  });
});
