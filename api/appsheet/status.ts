import { handleDataStatus } from '../_lib/dataHandlers';

export default async function handler(req: { url?: string }, res: Parameters<typeof handleDataStatus>[1]) {
  await handleDataStatus(req, res);
}
