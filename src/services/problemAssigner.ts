import { ProblemGoal } from "../schemas/problem";
import { getLocalState, setSessionState } from "../storage";
import problemsBank from "../../data/problems.json";

export async function assignNextProblem(): Promise<ProblemGoal | null> {
  const local = await getLocalState();
  let nextProblem: ProblemGoal | null = null;

  if (local.useGoalMode && local.pdfGoals.length > 0) {
    let index = local.goalIndex || 0;
    if (index >= local.pdfGoals.length) {
      // Loop or reset to random mode
      index = 0;
    }
    nextProblem = local.pdfGoals[index] as ProblemGoal;
    await setSessionState({
      currentProblemSlug: nextProblem.slug,
      currentProblemTitle: nextProblem.title,
      currentProblemDifficulty: nextProblem.difficulty,
      currentProblemTags: nextProblem.tags || [],
      currentProblemPreview: nextProblem.preview || ""
    });
    return nextProblem;
  }

  // Fallback random mode from problem bank
  const problems = problemsBank as ProblemGoal[];
  const isEasy = Math.random() > 0.5;
  const targetDiff = isEasy ? "Easy" : "Medium";
  const filtered = problems.filter((p) => p.difficulty === targetDiff);

  if (filtered.length > 0) {
    nextProblem = filtered[Math.floor(Math.random() * filtered.length)];
  } else {
    nextProblem = problems[Math.floor(Math.random() * problems.length)];
  }

  if (nextProblem) {
    await setSessionState({
      currentProblemSlug: nextProblem.slug,
      currentProblemTitle: nextProblem.title,
      currentProblemDifficulty: nextProblem.difficulty,
      currentProblemTags: nextProblem.tags || [],
      currentProblemPreview: nextProblem.preview || ""
    });
  }

  return nextProblem;
}
