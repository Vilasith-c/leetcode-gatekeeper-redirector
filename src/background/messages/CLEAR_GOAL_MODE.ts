import type { PlasmoMessaging } from "@plasmohq/messaging";
import { assignNextProblem } from "../../services/problemAssigner";
import { setLocalState } from "../../storage";

const handler: PlasmoMessaging.Handler = async (req, res) => {
  await setLocalState({
    useGoalMode: false,
    pdfGoals: [],
    pdfGoalsMeta: null,
    goalIndex: 0
  });

  await assignNextProblem();
  res.send({ success: true });
};

export default handler;
