import { z } from "zod";
import { bulletIdSchema } from "./bulletRefs.js";

export const tailorOutputV1Schema = z
  .object({
    tailorOutputVersion: z.literal("1"),
    summary: z.string().min(1),
    experienceSelections: z.array(bulletIdSchema),
    skillsOrdering: z.array(bulletIdSchema),
    omissions: z.array(bulletIdSchema).optional(),
    rationaleHash: z.string().optional(),
  })
  .strict();

export type TailorOutputV1 = z.infer<typeof tailorOutputV1Schema>;
