import type { PlasmoMessaging } from "@plasmohq/messaging";
import { getLocalState, setLocalState } from "../../storage";
import { getTodayString } from "../../services/scheduler";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const local = await getLocalState();
  if (local.streak.freezeTokens > 0) {
    const todayStr = getTodayString();
    const todayHistory = local.history[todayStr] || { solved: 0, blocked: 0 };
    todayHistory.freezeUsed = true;

    await setLocalState({
      streak: { ...local.streak, freezeTokens: local.streak.freezeTokens - 1 },
      history: { ...local.history, [todayStr]: todayHistory }
    });

    if (typeof chrome !== "undefined" && chrome.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon128.png"),
        title: "Mad Coder Pro",
        message: `🧊 Freeze token activated for today!`
      });
    }

    res.send({ success: true, remaining: local.streak.freezeTokens - 1 });
  } else {
    res.send({ success: false, reason: "no_tokens" });
  }
};

export default handler;
