import type { PlasmoMessaging } from "@plasmohq/messaging";
import { getLocalState, getSessionState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const session = await getSessionState();
  const local = await getLocalState();
  res.send({ session, local });
};

export default handler;
