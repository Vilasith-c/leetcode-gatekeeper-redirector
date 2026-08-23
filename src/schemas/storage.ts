import { z } from "zod";
import { ProblemGoalSchema } from "./problem";

export const WhitelistEntrySchema = z.object({
  id: z.string(),
  domain: z.string(),
  addedAt: z.number(),
  label: z.string()
});

export const StreakDataSchema = z.object({
  current: z.number().default(0),
  longest: z.number().default(0),
  lastSolveDate: z.string().nullable().default(null),
  freezeTokens: z.number().default(0)
});

export const XpDataSchema = z.object({
  total: z.number().default(0),
  level: z.number().default(1),
  levelName: z.string().default("Beginner"),
  levelThresholds: z.array(z.number()).default([0, 100, 300, 700, 1500])
});

export const OverridesDataSchema = z.object({
  usedThisWeek: z.number().default(0),
  weekResetDate: z.string().default(""),
  totalAllTime: z.number().default(0)
});

export const SessionStateSchema = z.object({
  sessionActive: z.boolean().default(false),
  currentProblemSlug: z.string().default(""),
  currentProblemTitle: z.string().default(""),
  currentProblemDifficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  currentProblemTags: z.array(z.string()).default([]),
  freedomExpiresAt: z.number().default(0),
  freedomEarnedMinutes: z.number().default(0),
  solvedThisSession: z.number().default(0),
  blockCountThisSession: z.number().default(0),
  sessionStartedAt: z.number().default(0),
  currentProblemPreview: z.string().default("")
});

export const DailyHistoryEntrySchema = z.object({
  solved: z.number().default(0),
  blocked: z.number().default(0),
  overridesUsed: z.number().default(0),
  freezeUsed: z.boolean().default(false),
  totalFreedomEarned: z.number().default(0)
});

export const LocalStateSchema = z.object({
  streak: StreakDataSchema.default({ current: 0, longest: 0, lastSolveDate: null, freezeTokens: 0 }),
  xp: XpDataSchema.default({ total: 0, level: 1, levelName: "Beginner", levelThresholds: [0, 100, 300, 700, 1500] }),
  whitelist: z.array(WhitelistEntrySchema).default([]),
  pdfGoals: z.array(ProblemGoalSchema).default([]),
  pdfGoalsMeta: z
    .object({
      filename: z.string(),
      parsedAt: z.number(),
      topicPreferences: z.array(z.string()).optional()
    })
    .nullable()
    .default(null),
  useGoalMode: z.boolean().default(false),
  goalIndex: z.number().default(0),
  overrides: OverridesDataSchema.default({ usedThisWeek: 0, weekResetDate: "", totalAllTime: 0 }),
  history: z.record(z.string(), DailyHistoryEntrySchema).default({})
});

export type WhitelistEntry = z.infer<typeof WhitelistEntrySchema>;
export type StreakData = z.infer<typeof StreakDataSchema>;
export type XpData = z.infer<typeof XpDataSchema>;
export type OverridesData = z.infer<typeof OverridesDataSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
export type DailyHistoryEntry = z.infer<typeof DailyHistoryEntrySchema>;
export type LocalState = z.infer<typeof LocalStateSchema>;

export const DEFAULT_SESSION_STATE: SessionState = SessionStateSchema.parse({});
export const DEFAULT_LOCAL_STATE: LocalState = LocalStateSchema.parse({
  whitelist: [
    { id: "default-0", domain: "leetcode.com", addedAt: Date.now(), label: "LeetCode" },
    { id: "default-1", domain: "developer.mozilla.org", addedAt: Date.now(), label: "MDN Docs" },
    { id: "default-2", domain: "docs.python.org", addedAt: Date.now(), label: "Python Docs" },
    { id: "default-3", domain: "cppreference.com", addedAt: Date.now(), label: "CPP Reference" },
    { id: "default-4", domain: "docs.oracle.com", addedAt: Date.now(), label: "Oracle Docs" },
    { id: "default-5", domain: "stackoverflow.com", addedAt: Date.now(), label: "StackOverflow" },
    { id: "default-6", domain: "github.com", addedAt: Date.now(), label: "GitHub" },
    { id: "default-7", domain: "docs.github.com", addedAt: Date.now(), label: "GitHub Docs" },
    { id: "default-8", domain: "en.wikipedia.org", addedAt: Date.now(), label: "Wikipedia" },
    { id: "default-9", domain: "geeksforgeeks.org", addedAt: Date.now(), label: "GeeksForGeeks" },
    { id: "default-10", domain: "visualgo.net", addedAt: Date.now(), label: "VisuAlgo" },
    { id: "default-11", domain: "cs.usfca.edu", addedAt: Date.now(), label: "USFCA Visualizations" },
    { id: "default-12", domain: "bigocheatsheet.com", addedAt: Date.now(), label: "BigO CheatSheet" },
    { id: "default-13", domain: "neetcode.io", addedAt: Date.now(), label: "NeetCode" },
    { id: "default-14", domain: "youtube.com/watch*", addedAt: Date.now(), label: "YouTube Videos" }
  ]
});
