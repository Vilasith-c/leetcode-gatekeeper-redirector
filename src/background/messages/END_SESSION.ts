import type { PlasmoMessaging } from "@plasmohq/messaging";
import { rebuildDNRRules } from "../../services/dnr";
import { logAnalyticsEvent } from "../../services/analytics";
import { getSessionState, setSessionState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const session = await getSessionState();
  await logAnalyticsEvent("SESSION_END", {
    duration: Date.now() - session.sessionStartedAt,
    solvedCount: session.solvedThisSession,
    blockCount: session.blockCountThisSession
  });

  await setSessionState({ sessionActive: false });
  await rebuildDNRRules([], false);

  if (typeof chrome !== "undefined" && chrome.action) {
    chrome.action.setBadgeText({ text: "" });
  }

  res.send({ success: true });
};

export default handler;
