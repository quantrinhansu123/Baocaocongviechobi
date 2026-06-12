import { handleDataEdit, withJsonApiHandler } from '../../api/_lib/dataHandlers';

export default withJsonApiHandler(async (req, res) => {
  await handleDataEdit(req as { on: (event: string, handler: (chunk: Buffer) => void) => void }, res);
});
