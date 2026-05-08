import { PLANS, type VercelRequest, type VercelResponse } from '../_lib';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json(Object.values(PLANS));
}
