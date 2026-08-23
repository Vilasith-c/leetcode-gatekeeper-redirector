import type { PlasmoMessaging } from "@plasmohq/messaging";
import { UpdateWhitelistPayloadSchema } from "../../schemas/messages";
import { rebuildDNRRules } from "../../services/dnr";
import { getSessionState, setLocalState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const payload = UpdateWhitelistPayloadSchema.parse(req.body);
  await setLocalState({ whitelist: payload.whitelist });

  const session = await getSessionState();
  if (session.sessionActive) {
    await rebuildDNRRules(payload.whitelist, true);
  }

  res.send({ success: true });
};

export default handler;
