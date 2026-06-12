import { handleDataFindGet, handleDataFindPost, withJsonApiHandler } from '../_lib/dataHandlers';

export default withJsonApiHandler(async (req, res) => {
  const request = req as { method?: string; url?: string; on: (e: string, h: (c: Buffer) => void) => void };
  if (request.method === 'POST') {
    await handleDataFindPost(request, res);
    return;
  }
  await handleDataFindGet(request, res);
});
