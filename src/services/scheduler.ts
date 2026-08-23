export function calculateFreedomMinutes(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return 15;
    case "hard":
      return 40;
    case "medium":
    default:
      return 25;
  }
}

export function calculateXp(
  difficulty: string,
  isEarlyBird = false,
  streakDays = 0,
  usedOverride = false
): number {
  let xp = 0;
  const diff = difficulty.toLowerCase();

  if (diff === "easy") xp += 10;
  else if (diff === "medium") xp += 20;
  else if (diff === "hard") xp += 35;
  else xp += 15;

  if (isEarlyBird) xp += 5;
  if (!usedOverride) xp += 3;
  if (streakDays >= 30) xp += 10;
  else if (streakDays >= 7) xp += 5;

  if (usedOverride) xp = Math.max(0, xp - 5);

  return xp;
}

export function getLevelInfo(totalXp: number): { level: number; levelName: string } {
  if (totalXp >= 1500) return { level: 5, levelName: "Elite" };
  if (totalXp >= 700) return { level: 4, levelName: "Relentless" };
  if (totalXp >= 300) return { level: 3, levelName: "Consistent" };
  if (totalXp >= 100) return { level: 2, levelName: "Grinder" };
  return { level: 1, levelName: "Beginner" };
}

export function getTodayString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getTodayString(d);
}

export function nextMidnightTimestamp(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
