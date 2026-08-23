import { describe, it, expect } from "vitest";
import { calculateXp, getLevelInfo, getTodayString } from "../services/scheduler";

describe("Scheduler & Gamification Logic", () => {
  it("calculates XP base rewards correctly per difficulty", () => {
    expect(calculateXp("Easy", false, 0, false)).toBe(13); // 10 base + 3 no-override
    expect(calculateXp("Medium", false, 0, false)).toBe(23); // 20 base + 3 no-override
    expect(calculateXp("Hard", false, 0, false)).toBe(38); // 35 base + 3 no-override
  });

  it("applies early bird and streak bonuses", () => {
    // Medium (20) + early bird (5) + no override (3) + 7-day streak bonus (5) = 33
    expect(calculateXp("Medium", true, 7, false)).toBe(33);
    // Medium (20) + early bird (5) + no override (3) + 30-day streak bonus (10) = 38
    expect(calculateXp("Medium", true, 30, false)).toBe(38);
  });

  it("applies penalty when override was used", () => {
    // Medium (20) - 5 penalty = 15
    expect(calculateXp("Medium", false, 0, true)).toBe(15);
  });

  it("calculates level and levelName based on total XP", () => {
    expect(getLevelInfo(0)).toEqual({ level: 1, levelName: "Beginner" });
    expect(getLevelInfo(150)).toEqual({ level: 2, levelName: "Grinder" });
    expect(getLevelInfo(450)).toEqual({ level: 3, levelName: "Consistent" });
    expect(getLevelInfo(800)).toEqual({ level: 4, levelName: "Relentless" });
    expect(getLevelInfo(2000)).toEqual({ level: 5, levelName: "Elite" });
  });

  it("formats date strings in YYYY-MM-DD format", () => {
    const testDate = new Date(2025, 6, 15); // July 15, 2025
    expect(getTodayString(testDate)).toBe("2025-07-15");
  });
});
