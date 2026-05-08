import {
  createProductsIfMissing,
  fail,
  requireAdmin,
  type VercelRequest,
  type VercelResponse,
} from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);

  try {
    const result = await createProductsIfMissing();
    res.status(200).json({
      ok: true,
      created: result.created,
      existed: result.existed,
      envVars: result.envVars,
      next_steps: [
        'Set the envVars block on Vercel (Project → Settings → Environment Variables)',
        'Trigger a redeploy',
      ],
    });
  } catch (e) {
    console.error('[admin] setup-dodo-products failed:', e);
    fail(res, 500, e instanceof Error ? e.message : 'setup failed');
  }
}
