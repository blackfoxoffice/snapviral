import DodoPayments from 'dodopayments';
import { getSecret } from './secrets.js';
import { getServiceClient } from './supabase.js';

export type Plan = 'free' | 'starter' | 'creator' | 'pro' | 'studio';
export type PlanStatus = 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';
export type Currency = 'USD' | 'INR';

export interface PlanDef {
  key: Plan;
  name: string;
  description: string;
  /** USD cents per month. */
  monthlyPriceUsdCents: number;
  /** INR paise per month (smallest unit, 100 paise = ₹1). */
  monthlyPriceInrPaise: number;
  monthlyVideoLimit: number;
  maxDurationSeconds: number;
  features: string[];
}

export const PLANS: Record<Plan, PlanDef> = {
  free: {
    key: 'free',
    name: 'Free',
    description: 'Try Newsflow Studio',
    monthlyPriceUsdCents: 0,
    monthlyPriceInrPaise: 0,
    monthlyVideoLimit: 2,
    maxDurationSeconds: 30,
    features: [
      '2 videos / month',
      '30-second max duration',
      'Tamil, English, Hindi narration',
      'Watermark on output',
    ],
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    description: 'Start publishing — perfect for testing the channel',
    monthlyPriceUsdCents: 1900,
    monthlyPriceInrPaise: 149900, // ₹1,499
    monthlyVideoLimit: 10,
    maxDurationSeconds: 60,
    features: [
      '10 videos / month',
      '60-second max duration',
      'No watermark',
      'All languages (Tamil, English, Hindi)',
      'Email support',
    ],
  },
  creator: {
    key: 'creator',
    name: 'Creator',
    description: 'For creators publishing multiple times a week',
    monthlyPriceUsdCents: 2900,
    monthlyPriceInrPaise: 229900, // ₹2,299
    monthlyVideoLimit: 30,
    maxDurationSeconds: 60,
    features: [
      '30 videos / month',
      '60-second max duration',
      'YouTube auto-publish + scheduling',
      'AI-generated metadata + tags',
      'No watermark',
      'Email support',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    description: 'For daily publishers running a real channel',
    monthlyPriceUsdCents: 4900,
    monthlyPriceInrPaise: 399900, // ₹3,999
    monthlyVideoLimit: 60,
    maxDurationSeconds: 60,
    features: [
      '60 videos / month',
      '60-second max duration',
      'Live web research (Perplexity)',
      'Brand logo overlay',
      'Priority generation queue',
      'All Creator features',
    ],
  },
  studio: {
    key: 'studio',
    name: 'Studio',
    description: 'For news teams and small media businesses',
    monthlyPriceUsdCents: 9900,
    monthlyPriceInrPaise: 799900, // ₹7,999
    monthlyVideoLimit: 200,
    maxDurationSeconds: 90,
    features: [
      '200 videos / month',
      '90-second max duration',
      'Highest priority queue',
      'Team admin + audit log',
      'Dedicated support channel',
      'All Pro features',
    ],
  },
};

let _client: DodoPayments | null = null;

async function getClient(): Promise<DodoPayments> {
  if (_client) return _client;
  const apiKey = (await getSecret('DODO_PAYMENTS_API_KEY')) ?? process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) throw new Error('DODO_PAYMENTS_API_KEY is not configured');
  const env = process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode';
  _client = new DodoPayments({
    bearerToken: apiKey,
    environment: env,
  });
  return _client;
}

/**
 * Plan + currency → env var name.
 * e.g. starter + USD → DODO_PRODUCT_STARTER_USD
 */
const productIdEnvKey = (plan: Plan, currency: Currency) =>
  `DODO_PRODUCT_${plan.toUpperCase()}_${currency}`;

export function getProductId(plan: Plan, currency: Currency): string | undefined {
  if (plan === 'free') return undefined;
  return process.env[productIdEnvKey(plan, currency)];
}

export async function createCheckoutSession(args: {
  userId: string;
  email: string;
  plan: Plan;
  currency: Currency;
  returnUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  if (args.plan === 'free') throw new Error('Free plan does not need checkout');
  const productId = getProductId(args.plan, args.currency);
  if (!productId) {
    throw new Error(
      `No Dodo product configured for ${args.plan}/${args.currency}. ` +
        `Run /api/admin/bootstrap/setup-dodo-products first, then set ` +
        `${productIdEnvKey(args.plan, args.currency)} on the API server.`,
    );
  }

  const client = await getClient();
  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    return_url: args.returnUrl,
    customer: { email: args.email },
    metadata: {
      user_id: args.userId,
      plan: args.plan,
      currency: args.currency,
    },
    feature_flags: {
      allow_discount_code: true,
      allow_phone_number_collection: false,
      allow_currency_selection: false,
    },
  });

  const sessionAny = session as unknown as {
    checkout_url?: string;
    session_id?: string;
    url?: string;
    id?: string;
  };
  const url = sessionAny.checkout_url ?? sessionAny.url;
  const id = sessionAny.session_id ?? sessionAny.id;
  if (!url) throw new Error('Dodo checkout session has no URL: ' + JSON.stringify(sessionAny));
  return { url, sessionId: id ?? '' };
}

export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  const client = await getClient();
  const portal = await client.customers.customerPortal.create(customerId, { send_email: false });
  const portalAny = portal as unknown as { link?: string; url?: string };
  const url = portalAny.link ?? portalAny.url;
  if (!url) throw new Error('Dodo portal has no URL');
  return url;
}

export async function applySubscriptionEvent(args: {
  userId: string;
  plan: Plan;
  status: PlanStatus;
  currentPeriodEnd?: string | null;
  dodoCustomerId?: string | null;
  dodoSubscriptionId?: string | null;
}): Promise<void> {
  const supa = getServiceClient();
  const update: Record<string, unknown> = {
    plan: args.plan,
    plan_status: args.status,
  };
  if (args.currentPeriodEnd !== undefined) update.current_period_end = args.currentPeriodEnd;
  if (args.dodoCustomerId !== undefined) update.dodo_customer_id = args.dodoCustomerId;
  if (args.dodoSubscriptionId !== undefined) update.dodo_subscription_id = args.dodoSubscriptionId;

  const { error } = await supa.from('profiles').update(update).eq('id', args.userId);
  if (error) throw error;
}

/**
 * Idempotently provision USD + INR products for each paid plan.
 * Re-running is safe: existing products are detected by name and reused.
 */
export async function createProductsIfMissing(): Promise<{
  created: string[];
  existed: string[];
  envVars: Record<string, string>;
}> {
  const client = await getClient();
  const existing = await client.products.list();
  const byName = new Map<string, string>();
  for await (const p of existing) {
    if (p && p.name) byName.set(p.name, p.product_id);
  }

  const created: string[] = [];
  const existed: string[] = [];
  const envVars: Record<string, string> = {};

  const plans: Plan[] = ['starter', 'creator', 'pro', 'studio'];
  const currencies: Currency[] = ['USD', 'INR'];

  for (const plan of plans) {
    for (const currency of currencies) {
      const def = PLANS[plan];
      const cents = currency === 'USD' ? def.monthlyPriceUsdCents : def.monthlyPriceInrPaise;
      const name = `Newsflow ${def.name} (${currency})`;
      let productId = byName.get(name);

      if (!productId) {
        const product = await client.products.create({
          name,
          description: def.description,
          tax_category: 'saas',
          price: {
            type: 'recurring_price',
            currency,
            price: cents,
            payment_frequency_count: 1,
            payment_frequency_interval: 'Month',
            subscription_period_count: 1,
            subscription_period_interval: 'Month',
            discount: 0,
            tax_inclusive: false,
            purchasing_power_parity: false,
            trial_period_days: 0,
          } as any,
        });
        productId = product.product_id;
        created.push(`${name} → ${productId}`);
      } else {
        existed.push(`${name} → ${productId}`);
      }

      envVars[productIdEnvKey(plan, currency)] = productId;
    }
  }

  console.log('\n[dodo] Product setup complete. Env vars:');
  for (const [k, v] of Object.entries(envVars)) console.log(`  ${k}=${v}`);
  console.log('');

  return { created, existed, envVars };
}

/**
 * Idempotently register the subscription/payment webhook on Dodo.
 * Returns the signing secret so we can store it as DODO_PAYMENTS_WEBHOOK_KEY.
 */
export async function registerWebhookIfMissing(args: {
  webhookUrl: string;
}): Promise<{ webhookId: string; secret: string; created: boolean }> {
  const client = await getClient();

  const wantedEvents = [
    'subscription.active',
    'subscription.renewed',
    'subscription.cancelled',
    'subscription.expired',
    'subscription.failed',
    'subscription.on_hold',
    'subscription.plan_changed',
    'subscription.updated',
    'payment.failed',
    'payment.succeeded',
  ];

  // Reuse if a webhook already points at the same URL
  const list = await client.webhooks.list();
  for await (const wh of list) {
    if (wh && (wh as { url?: string }).url === args.webhookUrl) {
      const sec = await client.webhooks.retrieveSecret(wh.id);
      return {
        webhookId: wh.id,
        secret: (sec as unknown as { secret: string }).secret,
        created: false,
      };
    }
  }

  const wh = await client.webhooks.create({
    url: args.webhookUrl,
    description: 'Newsflow Studio subscription + payment events',
    filter_types: wantedEvents as any,
    disabled: false,
  });
  const sec = await client.webhooks.retrieveSecret(wh.id);
  return {
    webhookId: wh.id,
    secret: (sec as unknown as { secret: string }).secret,
    created: true,
  };
}
