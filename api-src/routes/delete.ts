import { handleDataDelete, withJsonApiHandler } from '../../api/_lib/dataHandlers';

export default withJsonApiHandler(async (req, res) => {
  await handleDataDelete(req as { on: (event: string, handler: (chunk: Buffer) => void) => void }, res);
});
