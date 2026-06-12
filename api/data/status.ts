import { handleDataStatus, withJsonApiHandler } from '../_lib/dataHandlers';

export default withJsonApiHandler(async (req, res) => {
  await handleDataStatus(req as { url?: string }, res);
});
