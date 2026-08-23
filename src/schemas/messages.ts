import { z } from "zod";
import { ProblemGoalSchema } from "./problem";
import { WhitelistEntrySchema } from "./storage";

export const ProblemSolvedPayloadSchema = z.object({
  slug: z.string(),
  runtime: z.string().optional().default("N/A"),
  memory: z.string().optional().default("N/A"),
  language: z.string().optional().default("N/A")
});

export const WrongProblemPayloadSchema = z.object({
  currentSlug: z.string()
});

export const UpdateWhitelistPayloadSchema = z.object({
  whitelist: z.array(WhitelistEntrySchema)
});

export const SetGoalModePayloadSchema = z.object({
  goals: z.array(ProblemGoalSchema),
  meta: z.object({
    filename: z.string(),
    parsedAt: z.number(),
    topicPreferences: z.array(z.string()).optional()
  })
});

export type ProblemSolvedPayload = z.infer<typeof ProblemSolvedPayloadSchema>;
export type WrongProblemPayload = z.infer<typeof WrongProblemPayloadSchema>;
export type UpdateWhitelistPayload = z.infer<typeof UpdateWhitelistPayloadSchema>;
export type SetGoalModePayload = z.infer<typeof SetGoalModePayloadSchema>;
