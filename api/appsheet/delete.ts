import { handleDataDelete } from '../_lib/dataHandlers';

export default async function handler(
  req: { on: (e: string, h: (c: Buffer) => void) => void },
  res: Parameters<typeof handleDataDelete>[1]
) {
  await handleDataDelete(req, res);
}
