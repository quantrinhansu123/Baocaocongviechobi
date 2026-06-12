import { handleDataFindGet, handleDataFindPost } from '../_lib/dataHandlers';

export default async function handler(
  req: { method?: string; url?: string; on: (e: string, h: (c: Buffer) => void) => void },
  res: Parameters<typeof handleDataFindGet>[1]
) {
  if (req.method === 'POST') {
    await handleDataFindPost(req, res);
    return;
  }
  await handleDataFindGet(req, res);
}
