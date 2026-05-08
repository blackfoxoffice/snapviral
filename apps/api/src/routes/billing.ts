import express, { Router, Request, Response } from 'express';
import { Webhook } from 'standardwebhooks';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';
import {
  PLANS,
  Plan,
  PlanStatus,
  Currency,
  applySubscriptionEvent,
  createCheckoutSession,
  getCustomerPortalUrl,
} from '../services/billing.js';

export const billingRouter = Router();

// ===== Public route: webhook (must be registered before requireAuth) =====
//
// Dodo posts here on subscription / payment lifecycle events. We verify the
// signature using the Standard Webhooks spec, then update the user's profile.
//
// IMPORTANT: this route reads the raw body for signature verification, so
// `express.raw` is mounted on the route directly (the global express.json
// would consume the body before we see it).
billingRouter.post(
  '/webhook',
  express.raw({ type: '*/*', limit: '2mb' }),
  async (req: Request, res: Response) => {
    const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!secret) {
      console.error('[billing] DODO_PAYMENTS_WEBHOOK_KEY not configured');
      res.status(500).send('webhook secret not configured');
      return;
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    const headers = {
      'webhook-id': req.header('webhook-id') ?? '',
      'webhook-signature': req.header('webhook-signature') ?? '',
      'webhook-timestamp': req.header('webhook-timestamp') ?? '',
    };

    try {
      const wh = new Webhook(secret);
      wh.verify(rawBody, headers);
    } catch (e) {
      console.error('[billing] webhook signature verification failed:', e);
      res.status(401).send('invalid signature');
      return;
    }

    let event: {
      type?: string;
      data?: {
        metadata?: { user_id?: string; plan?: Plan; currency?: string };
        customer?: { customer_id?: string; email?: string };
        subscription_id?: string;
        status?: string;
        next_billing_date?: string;
        current_period_end?: string;
        // Payment-event fields
        payment_id?: string;
        amount?: number;            // minor units (cents / paise)
        total_amount?: number;
        currency?: string;
        receipt_url?: string;
        invoice_url?: string;
        payment_method?: string;
        failure_reason?: string;
        created_at?: string;
        occurred_at?: string;
        product_cart?: Array<{ product_id?: string }>;
      };
      id?: string;
      timestamp?: string;
    } = {};
    try {
      event = JSON.parse(rawBody);
    } catch {
      res.status(400).send('invalid json');
      return;
    }

    const supa = getServiceClient();

    // Persist event for audit
    await supa.from('subscription_events').insert({
      user_id: event.data?.metadata?.user_id ?? null,
      dodo_event_id: event.id ?? null,
      event_type: event.type ?? 'unknown',
      payload: event,
    });

    const userId = event.data?.metadata?.user_id;
    if (!userId) {
      console.warn('[billing] webhook with no user_id in metadata, type=' + event.type);
      res.status(200).send('ok'); // 200 so Dodo doesn't retry
      return;
    }

    const plan = (event.data?.metadata?.plan as Plan) ?? 'free';
    const dodoStatus = String(event.data?.status ?? '').toLowerCase();
    let status: PlanStatus = 'active';
    if (dodoStatus.includes('past_due') || dodoStatus.includes('failed')) status = 'past_due';
    else if (dodoStatus.includes('cancel')) status = 'canceled';
    else if (dodoStatus.includes('paus')) status = 'paused';
    else if (dodoStatus.includes('trial')) status = 'trialing';

    const eventType = event.type ?? '';

    if (eventType.includes('subscription.active') || eventType.includes('subscription.renewed')) {
      await applySubscriptionEvent({
        userId,
        plan,
        status,
        currentPeriodEnd: event.data?.next_billing_date ?? event.data?.current_period_end ?? null,
        dodoCustomerId: event.data?.customer?.customer_id ?? null,
        dodoSubscriptionId: event.data?.subscription_id ?? null,
      });
    } else if (eventType.includes('subscription.cancelled') || eventType.includes('subscription.expired')) {
      await applySubscriptionEvent({
        userId,
        plan: 'free',
        status: 'canceled',
        currentPeriodEnd: null,
      });
    } else if (eventType.includes('subscription.failed')) {
      await applySubscriptionEvent({
        userId,
        plan,
        status: 'past_due',
      });
    }

    // =====================================================================
    // Payment receipt events — write a row into public.payments.
    // We accept any of: payment.succeeded / payment.failed / payment.refunded
    // (plus the older payment.* variants Dodo may send).
    // =====================================================================
    if (eventType.startsWith('payment.') || eventType.includes('invoice.paid')) {
      const paymentId =
        event.data?.payment_id ?? event.data?.subscription_id ?? event.id ?? null;
      const amountMinor = Number(event.data?.total_amount ?? event.data?.amount ?? 0);
      const currency = (event.data?.currency ?? event.data?.metadata?.currency ?? 'USD').toUpperCase();
      let payStatus: 'succeeded' | 'failed' | 'refunded' | 'pending' = 'succeeded';
      if (eventType.includes('failed')) payStatus = 'failed';
      else if (eventType.includes('refund')) payStatus = 'refunded';
      else if (eventType.includes('pending')) payStatus = 'pending';

      const occurredAt =
        event.data?.occurred_at ?? event.data?.created_at ?? event.timestamp ?? new Date().toISOString();

      // Idempotent — onConflict on dodo_payment_id when it's present.
      const insert = {
        user_id: userId,
        dodo_payment_id: paymentId,
        dodo_subscription_id: event.data?.subscription_id ?? null,
        dodo_customer_id: event.data?.customer?.customer_id ?? null,
        amount_minor: amountMinor || 0,
        currency,
        status: payStatus,
        plan,
        description: eventType,
        receipt_url: event.data?.receipt_url ?? null,
        invoice_url: event.data?.invoice_url ?? null,
        payment_method: event.data?.payment_method ?? null,
        failure_reason: event.data?.failure_reason ?? null,
        metadata: event.data?.metadata ?? {},
        occurred_at: occurredAt,
      };
      if (paymentId) {
        await supa.from('payments').upsert(insert, { onConflict: 'dodo_payment_id' });
      } else {
        await supa.from('payments').insert(insert);
      }

      // Also bump plan_status to past_due on payment failure so the user UI
      // surfaces it immediately (the subscription.failed path may not fire
      // if the failure happens at one-off payment time).
      if (payStatus === 'failed') {
        await applySubscriptionEvent({ userId, plan, status: 'past_due' });
      }
    }

    res.status(200).send('ok');
  },
);

// ===== Authenticated routes =====
billingRouter.use(requireAuth);

billingRouter.get('/plans', (_req: Request, res: Response) => {
  res.json(Object.values(PLANS));
});

billingRouter.get('/me', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data: profile, error } = await supa
    .from('profiles')
    .select('plan, plan_status, current_period_end, dodo_customer_id, dodo_subscription_id')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  const { data: quota } = await supa
    .from('user_quota')
    .select('monthly_video_limit, max_duration_seconds, used_this_month')
    .eq('user_id', user.id)
    .single();

  res.json({
    plan: profile?.plan ?? 'free',
    plan_status: profile?.plan_status ?? 'active',
    current_period_end: profile?.current_period_end ?? null,
    has_active_subscription: !!profile?.dodo_subscription_id,
    quota: quota ?? null,
  });
});

billingRouter.post('/checkout', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { plan, currency } = req.body as { plan?: Plan; currency?: Currency };
  const validPaid: Plan[] = ['starter', 'creator', 'pro', 'studio'];
  if (!plan || !validPaid.includes(plan)) {
    res.status(400).json({ error: 'plan must be one of: starter, creator, pro, studio' });
    return;
  }
  if (currency !== 'USD' && currency !== 'INR') {
    res.status(400).json({ error: 'currency must be USD or INR' });
    return;
  }
  if (!user.email) {
    res.status(400).json({ error: 'user has no email' });
    return;
  }

  const webBase = process.env.WEB_BASE_URL ?? 'https://app.snapviral.in';
  try {
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      plan,
      currency,
      returnUrl: `${webBase}/billing?checkout=success`,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('[billing] checkout error', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'checkout failed' });
  }
});

billingRouter.post('/portal', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data } = await supa
    .from('profiles')
    .select('dodo_customer_id')
    .eq('id', user.id)
    .single();
  if (!data?.dodo_customer_id) {
    res.status(400).json({ error: 'no_subscription' });
    return;
  }
  try {
    const url = await getCustomerPortalUrl(data.dodo_customer_id);
    res.json({ url });
  } catch (e) {
    console.error('[billing] portal error', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'portal failed' });
  }
});

// =====================================================================
// User payment receipts — most recent first.
// =====================================================================
billingRouter.get('/payments', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('payments')
    .select(
      'id, amount_minor, currency, status, plan, description, receipt_url, invoice_url, payment_method, failure_reason, occurred_at, dodo_payment_id',
    )
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .limit(100);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ payments: data ?? [] });
});
