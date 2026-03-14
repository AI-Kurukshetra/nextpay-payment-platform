import { z } from "zod";

export const createExperimentSchema = z.object({
  name: z.string().min(3).max(80),
  variants: z.array(z.string().min(1).max(40)).min(2).max(10),
  trafficPercent: z.number().int().min(1).max(100).default(100),
  isActive: z.boolean().default(true)
});

export const assignExperimentVariantSchema = z.object({
  subjectKey: z.string().min(3).max(120)
});

export type CreateExperimentInput = z.infer<typeof createExperimentSchema>;
export type AssignExperimentVariantInput = z.infer<typeof assignExperimentVariantSchema>;
