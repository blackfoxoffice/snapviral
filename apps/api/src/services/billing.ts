import DodoPayments from 'dodopayments';
import { getSecret } from './secrets.js';
import { getServiceClient } from './supabase.js';

export type Plan = 'free' | 'creator' | 'studio';
export type PlanStatus = 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';

export interface PlanDef {
  key: Plan;
  name: string;
  description: string;
  /** USD cents per month. 0 means free, no checkout. */
  monthlyPriceCents: number;
  /** USD cents per year. */
  annualPriceCents: number;
  monthlyVideoLimit: number;
  maxDurationSeconds: number;
  features: string[];
}

export const PLANS: Record<Plan, PlanDef> = {
  free: {
    key: 'free',
    name: 'Free',
    description: 'Try Newsflow Studio',
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    monthlyVideoLimit: 2,
    maxDurationSeconds: 30,
    features: [
      '2 videos / month',
      '30-second max duration',
      'Tamil, English, Hindi narration',
      'Watermark on output',
    ],
  },
  creator: {
    key: 'creator',
    name: 'Creator',
    description: 'For solo creators publishing daily',
    monthlyPriceCents: 1900,
    annualPriceCents: 19000, // 2 months free
    monthlyVideoLimit: 30,
    maxDurationSeconds: 60,
    features: [
      '30 videos / month',
      '60-second max duration',
      'No watermark',
      'YouTube auto-publish + scheduling',
      'Live web research (Perplexity)',
      'Brand logo overlay',
    ],
  },
  studio: {
    key: 'studio',
    name: 'Studio',
    description: 'For news teams',
    monthlyPriceCents: 4900,
    annualPriceCents: 49000, // 2 months free
    monthlyVideoLimit: 100,
    maxDurationSeconds: 90,
    features: [
      '100 videos / month',
      '90-second max duration',
      'Priority generation queue',
      'AI-generated metadata + tags',
      'All Creator features',
      'Email support',
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
 * Plan/interval → env var name. Product IDs live as Railway env vars
 * because they're config, not secrets — no need to encrypt.
 */
const productIdEnvKey = (plan: Plan, interval: 'monthly' | 'annual') =>
  `DODO_PRODUCT_${plan.toUpperCase()}_${interval.toUpperCase()}`;

export function getProductId(plan: Plan, interval: 'monthly' | 'annual'): string | undefined {
  if (plan === 'free') return undefined;
  return process.env[productIdEnvKey(plan, interval)];
}

/**
 * Create a Dodo Checkout Session for a paid plan, return the hosted URL.
 */
export async function createCheckoutSession(args: {
  userId: string;
  email: string;
  plan: Plan;
  interval: 'monthly' | 'annual';
  returnUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  if (args.plan === 'free') throw new Error('Free plan does not need checkout');
  const productId = getProductId(args.plan, args.interval);
  if (!productId) {
    throw new Error(
      `No Dodo product configured for ${args.plan}/${args.interval}. ` +
        `Run the setup-dodo-products script to provision them and set ` +
        `DODO_PRODUCT_${args.plan.toUpperCase()}_${args.interval.toUpperCase()} on the API server.`,
    );
  }

  const client = await getClient();
  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    return_url: args.returnUrl,
    customer: {
      email: args.email,
    },
    metadata: {
      user_id: args.userId,
      plan: args.plan,
      interval: args.interval,
    },
    feature_flags: {
      allow_discount_code: true,
      allow_phone_number_collection: false,
      allow_currency_selection: true,
    },
  });

  // The SDK returns either a URL or session id depending on version
  const sessionAny = session as unknown as { checkout_url?: string; session_id?: string; url?: string; id?: string };
  const url = sessionAny.checkout_url ?? sessionAny.url;
  const id = sessionAny.session_id ?? sessionAny.id;
  if (!url) throw new Error('Dodo checkout session has no URL: ' + JSON.stringify(sessionAny));
  return { url, sessionId: id ?? '' };
}

/**
 * Create the customer portal URL for plan changes / cancellation.
 */
export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  const client = await getClient();
  const portal = await client.customers.customerPortal.create(customerId, { send_email: false });
  const portalAny = portal as unknown as { link?: string; url?: string };
  const url = portalAny.link ?? portalAny.url;
  if (!url) throw new Error('Dodo portal has no URL');
  return url;
}

/**
 * Apply a Dodo subscription event to the user's profile. Idempotent.
 */
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
 * Idempotently provision the 4 paid products on Dodo (creator/studio × monthly/annual).
 * Stores the resulting product_ids in public.app_secrets so checkout sessions can
 * reference them. Safe to run repeatedly — skips products that already exist by name.
 */
export async function createProductsIfMissing(): Promise<{ created: string[]; existed: string[] }> {
  const client = await getClient();
  const existing = await client.products.list();
  const byName = new Map<string, string>();
  for await (const p of existing) {
    if (p && p.name) byName.set(p.name, p.product_id);
  }

  const created: string[] = [];
  const existed: string[] = [];

  const todo: Array<{
    name: string;
    plan: Plan;
    interval: 'monthly' | 'annual';
    cents: number;
    description: string;
  }> = [];

  for (const plan of ['creator', 'studio'] as Plan[]) {
    const def = PLANS[plan];
    todo.push({
      name: `Newsflow ${def.name} — Monthly`,
      plan,
      interval: 'monthly',
      cents: def.monthlyPriceCents,
      description: def.description,
    });
    todo.push({
      name: `Newsflow ${def.name} — Annual`,
      plan,
      interval: 'annual',
      cents: def.annualPriceCents,
      description: def.description + ' (annual)',
    });
  }

  const envInstructions: string[] = [];

  for (const item of todo) {
    let productId = byName.get(item.name);

    if (!productId) {
      const product = await client.products.create({
        name: item.name,
        description: item.description,
        tax_category: 'saas',
        price: {
          type: 'recurring_price',
          currency: 'USD',
          price: item.cents,
          payment_frequency_count: 1,
          payment_frequency_interval: item.interval === 'monthly' ? 'Month' : 'Year',
          subscription_period_count: 1,
          subscription_period_interval: item.interval === 'monthly' ? 'Month' : 'Year',
          discount: 0,
          tax_inclusive: false,
          purchasing_power_parity: false,
          trial_period_days: 0,
        } as any,
      });
      productId = product.product_id;
      created.push(`${item.name} → ${productId}`);
    } else {
      existed.push(`${item.name} → ${productId}`);
    }

    envInstructions.push(`${productIdEnvKey(item.plan, item.interval)}=${productId}`);
  }

  console.log('\n[dodo] Product setup complete. Add these to Railway env vars:');
  for (const line of envInstructions) console.log('  ' + line);
  console.log('');

  return { created, existed };
}
