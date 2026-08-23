import type { PlasmoMessaging } from "@plasmohq/messaging";
import { ProblemSolvedPayloadSchema } from "../../schemas/messages";
import { assignNextProblem } from "../../services/problemAssigner";
import { calculateFreedomMinutes, calculateXp, getLevelInfo, getTodayString } from "../../services/scheduler";
import { logAnalyticsEvent } from "../../services/analytics";
import { getLocalState, getSessionState, setLocalState, setSessionState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const payload = ProblemSolvedPayloadSchema.parse(req.body);
  const session = await getSessionState();

  if (session.currentProblemSlug === payload.slug || !session.currentProblemSlug) {
    const freedomMinutes = calculateFreedomMinutes(session.currentProblemDifficulty);
    const freedomExpiresAt = Date.now() + freedomMinutes * 60 * 1000;

    const local = await getLocalState();
    const todayStr = getTodayString();
    const isEarlyBird = new Date().getHours() < 9;
    const xpEarned = calculateXp(
      session.currentProblemDifficulty,
      isEarlyBird,
      local.streak.current,
      false
    );

    // Update Streak & XP
    const newXpTotal = local.xp.total + xpEarned;
    const { level, levelName } = getLevelInfo(newXpTotal);

    let streakCurrent = local.streak.current;
    let streakLongest = local.streak.longest;
    if (local.streak.lastSolveDate !== todayStr) {
      streakCurrent += 1;
      streakLongest = Math.max(streakLongest, streakCurrent);
    }

    const todayHistory = local.history[todayStr] || { solved: 0, blocked: 0, overridesUsed: 0 };
    todayHistory.solved += 1;
    todayHistory.totalFreedomEarned += freedomMinutes;

    await setLocalState({
      xp: { ...local.xp, total: newXpTotal, level, levelName },
      streak: { ...local.streak, current: streakCurrent, longest: streakLongest, lastSolveDate: todayStr },
      history: { ...local.history, [todayStr]: todayHistory }
    });

    await setSessionState({
      freedomExpiresAt,
      freedomEarnedMinutes: freedomMinutes,
      solvedThisSession: session.solvedThisSession + 1
    });

    await logAnalyticsEvent("SOLVE", {
      slug: payload.slug,
      title: session.currentProblemTitle,
      difficulty: session.currentProblemDifficulty,
      freedomEarned: freedomMinutes,
      xpEarned
    });

    if (typeof chrome !== "undefined" && chrome.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon128.png"),
        title: "Mad Coder Pro",
        message: `✅ "${session.currentProblemTitle}" solved! You earned ${freedomMinutes} minutes of freedom.`
      });
    }

    // Auto-assign next problem
    await assignNextProblem();
    res.send({ success: true, freedomMinutes });
  } else {
    res.send({ success: false, reason: "wrong_problem" });
  }
};

export default handler;
