import { handleDataEdit, withJsonApiHandler } from '../_lib/dataHandlers';

export default withJsonApiHandler(async (req, res) => {
  await handleDataEdit(req as { on: (e: string, h: (c: Buffer) => void) => void }, res);
});
