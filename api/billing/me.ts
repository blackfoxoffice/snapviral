import { fail, requireUser, type VercelRequest, type VercelResponse } from '../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data: profile } = await supa
    .from('profiles')
    .select('plan, plan_status, current_period_end, dodo_customer_id, dodo_subscription_id')
    .eq('id', user.id)
    .single();

  const { data: quota } = await supa
    .from('user_quota')
    .select('monthly_video_limit, max_duration_seconds, used_this_month')
    .eq('user_id', user.id)
    .single();

  res.status(200).json({
    plan: (profile as any)?.plan ?? 'free',
    plan_status: (profile as any)?.plan_status ?? 'active',
    current_period_end: (profile as any)?.current_period_end ?? null,
    has_active_subscription: !!(profile as any)?.dodo_subscription_id,
    quota: quota ?? null,
  });
}
