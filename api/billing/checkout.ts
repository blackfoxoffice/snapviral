import {
  WEB_BASE_URL,
  dodoClient,
  fail,
  getProductId,
  productIdEnvKey,
  requireUser,
  type Currency,
  type Plan,
  type VercelRequest,
  type VercelResponse,
} from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user } = r;
  if (!user.email) return fail(res, 400, 'user has no email');

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    plan?: Plan;
    currency?: Currency;
  };
  const validPaid: Plan[] = ['starter', 'creator', 'pro', 'studio'];
  if (!body.plan || !validPaid.includes(body.plan))
    return fail(res, 400, 'plan must be one of: starter, creator, pro, studio');
  if (body.currency !== 'USD' && body.currency !== 'INR')
    return fail(res, 400, 'currency must be USD or INR');

  const productId = getProductId(body.plan, body.currency);
  if (!productId) {
    return fail(
      res,
      500,
      `No Dodo product configured for ${body.plan}/${body.currency}. ` +
        `Set ${productIdEnvKey(body.plan, body.currency)} on Vercel.`,
    );
  }

  try {
    const client = dodoClient();
    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: `${WEB_BASE_URL.replace(/\/$/, '')}/billing?checkout=success`,
      customer: { email: user.email },
      metadata: {
        user_id: user.id,
        plan: body.plan,
        currency: body.currency,
      },
      feature_flags: {
        allow_discount_code: true,
        allow_phone_number_collection: false,
        allow_currency_selection: false,
      },
    });
    const a = session as unknown as {
      checkout_url?: string;
      url?: string;
      session_id?: string;
      id?: string;
    };
    const url = a.checkout_url ?? a.url;
    if (!url) return fail(res, 500, 'checkout session has no URL');
    res.status(200).json({ url });
  } catch (e) {
    console.error('[billing] checkout error', e);
    fail(res, 500, e instanceof Error ? e.message : 'checkout failed');
  }
}
