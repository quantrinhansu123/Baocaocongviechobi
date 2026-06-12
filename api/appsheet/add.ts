import { handleDataAdd } from '../_lib/dataHandlers';

export default async function handler(
  req: { on: (e: string, h: (c: Buffer) => void) => void },
  res: Parameters<typeof handleDataAdd>[1]
) {
  await handleDataAdd(req, res);
}
