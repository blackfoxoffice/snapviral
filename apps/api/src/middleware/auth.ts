import type { Request, Response, NextFunction } from 'express';
import { getServiceClient } from '../services/supabase.js';

export interface AuthedRequest extends Request {
  user: { id: string; email: string | null };
  accessToken: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const supa = getServiceClient();
  const { data, error } = await supa.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'invalid token' });
    return;
  }
  (req as AuthedRequest).user = { id: data.user.id, email: data.user.email ?? null };
  (req as AuthedRequest).accessToken = token;
  next();
}
