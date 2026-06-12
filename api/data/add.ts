import { handleDataAdd, withJsonApiHandler } from '../_lib/dataHandlers';

export default withJsonApiHandler(async (req, res) => {
  await handleDataAdd(req as { on: (e: string, h: (c: Buffer) => void) => void }, res);
});
