import type { PlasmoMessaging } from "@plasmohq/messaging";
import { assignNextProblem } from "../../services/problemAssigner";
import { rebuildDNRRules } from "../../services/dnr";
import { logAnalyticsEvent } from "../../services/analytics";
import { getLocalState, getSessionState, setSessionState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  await setSessionState({
    sessionActive: true,
    sessionStartedAt: Date.now(),
    solvedThisSession: 0,
    blockCountThisSession: 0,
    freedomExpiresAt: 0
  });

  const assigned = await assignNextProblem();
  const local = await getLocalState();
  await rebuildDNRRules(local.whitelist, true);

  if (typeof chrome !== "undefined" && chrome.action) {
    chrome.action.setBadgeText({ text: "🔒" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  }

  await logAnalyticsEvent("SESSION_START", {
    problemSlug: assigned?.slug,
    problemTitle: assigned?.title
  });

  const session = await getSessionState();
  res.send({ success: true, session });
};

export default handler;
