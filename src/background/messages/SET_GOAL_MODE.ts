import type { PlasmoMessaging } from "@plasmohq/messaging";
import { SetGoalModePayloadSchema } from "../../schemas/messages";
import { assignNextProblem } from "../../services/problemAssigner";
import { setLocalState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  const payload = SetGoalModePayloadSchema.parse(req.body);
  await setLocalState({
    pdfGoals: payload.goals,
    pdfGoalsMeta: payload.meta,
    useGoalMode: true,
    goalIndex: 0
  });

  await assignNextProblem();
  res.send({ success: true });
};

export default handler;
