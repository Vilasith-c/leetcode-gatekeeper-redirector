import type { PlasmoMessaging } from "@plasmohq/messaging";
import { getSessionState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const session = await getSessionState();
  res.send({
    success: true,
    assignedSlug: session.currentProblemSlug,
    assignedTitle: session.currentProblemTitle
  });
};

export default handler;
