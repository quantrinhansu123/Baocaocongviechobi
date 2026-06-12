import { handleDataFindGet, handleDataFindPost, withJsonApiHandler } from '../../api/_lib/dataHandlers';

type ApiRequest = {
  method?: string;
  url?: string;
  on: (event: string, handler: (chunk: Buffer) => void) => void;
};

export default withJsonApiHandler(async (req, res) => {
  const request = req as ApiRequest;
  if (request.method === 'POST') {
    await handleDataFindPost(request, res);
    return;
  }
  await handleDataFindGet(request, res);
});
