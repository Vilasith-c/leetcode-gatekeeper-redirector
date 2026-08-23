import { z } from "zod";

export const ProblemGoalSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  tags: z.array(z.string()).default([]),
  hint: z.string().optional().default(""),
  preview: z.string().optional().default(""),
  url: z.string().optional().default(""),
  companies: z.array(z.string()).optional().default([]),
  frequency: z.number().optional().default(50),
  confidence: z.enum(["url", "number", "title_match", "suggested"]).optional(),
  weekGroup: z.string().optional(),
  dayGroup: z.string().optional()
});

export type ProblemGoal = z.infer<typeof ProblemGoalSchema>;
