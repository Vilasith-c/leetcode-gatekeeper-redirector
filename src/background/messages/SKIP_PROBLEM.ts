import type { PlasmoMessaging } from "@plasmohq/messaging";
import { assignNextProblem } from "../../services/problemAssigner";
import { logAnalyticsEvent } from "../../services/analytics";
import { getLocalState, getSessionState, setLocalState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const session = await getSessionState();
  const local = await getLocalState();

  const newTotalXp = Math.max(0, local.xp.total - 5);
  await setLocalState({ xp: { ...local.xp, total: newTotalXp } });

  await logAnalyticsEvent("SKIP", {
    slug: session.currentProblemSlug,
    xpPenalty: 5,
    reason: "user_skip"
  });

  const nextProblem = await assignNextProblem();
  res.send({ success: true, nextProblem });
};

export default handler;
