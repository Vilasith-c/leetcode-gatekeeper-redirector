import type { PlasmoMessaging } from "@plasmohq/messaging";
import { logAnalyticsEvent } from "../../services/analytics";
import { getLocalState, getSessionState, setLocalState, setSessionState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const local = await getLocalState();
  if (local.overrides.usedThisWeek < 3) {
    const newUsed = local.overrides.usedThisWeek + 1;
    const newTotal = local.overrides.totalAllTime + 1;

    await setLocalState({
      overrides: { ...local.overrides, usedThisWeek: newUsed, totalAllTime: newTotal }
    });

    const freedomExpiresAt = Date.now() + 10 * 60 * 1000; // 10 mins freedom
    await setSessionState({ freedomExpiresAt });

    await logAnalyticsEvent("OVERRIDE", { reason: "user_requested", freedomGranted: 600000 });

    if (typeof chrome !== "undefined" && chrome.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon128.png"),
        title: "Mad Coder Pro",
        message: `🚨 Emergency Override used. ${3 - newUsed} remaining this week.`
      });
    }

    res.send({ success: true, remaining: 3 - newUsed });
  } else {
    res.send({ success: false, reason: "limit_reached" });
  }
};

export default handler;
