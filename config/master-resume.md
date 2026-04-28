> **Master resume format** (`packages/contracts`): use `## Section` headings. The exact titles **Skills** and **Experience** activate structured parsing — bullets MUST use HTML comment ids immediately after `-` as `- <!-- id: your-id --> Text`. Roles under Experience use `### Title` optionally followed by `<!-- id: role-id -->`. Ids MUST match `^[a-z0-9][a-z0-9_-]{2,63}$` (see `schemas/tailor-output-v1.json` pattern). Skills ordering in tailor JSON references **`skill-*` bullet ids**, not plain strings.

---

## Contact

Example Candidate — hello@example.com

## Skills

- <!-- id: skill-typescript --> TypeScript, APIs, rigorous reviews
- <!-- id: skill-nodejs --> Node.js backends and pragmatic ops

## Experience

### Sr. Engineer · Example Co <!-- id: role-example-co -->

- <!-- id: bull-ex-001 --> Owned payments reliability and rollout metrics
- <!-- id: bull-ex-002 --> Mentored juniors on testing and profiling
