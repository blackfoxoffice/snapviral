// Shared helpers for Vercel serverless billing functions.
// Runs on Vercel Node runtime. Talks to Supabase + Dodo Payments.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import DodoPayments from 'dodopayments';

// =====================================================================
// Environment
// =====================================================================
export const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'https://app.snapviral.in';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surfaced lazily so functions only fail when invoked, not at module load.
  // Vercel cold-start logs will show the variable name.
  console.warn('[billing] SUPABASE_URL or SUPABASE_ANON_KEY missing');
}

// =====================================================================
// Supabase client — anon role + caller's JWT in headers when present.
// RLS policies on payments + profiles handle authorization.
// =====================================================================
export function supabaseFromReq(authHeader?: string | string[] | null): SupabaseClient {
  const auth = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = auth;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Service-style client without a user JWT — used for SECURITY DEFINER RPC
// calls where RLS doesn't apply, and for verifying user JWTs via getUser().
export function supabaseAnon(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// =====================================================================
// Auth — verify Bearer JWT, return Supabase user.
// =====================================================================
export interface AuthedUser {
  id: string;
  email: string | null;
}

export async function requireUser(req: VercelRequest): Promise<
  | { user: AuthedUser; supa: SupabaseClient }
  | { error: { status: number; message: string } }
> {
  const auth = req.headers.authorization ?? req.headers.Authorization;
  const header = Array.isArray(auth) ? auth[0] : auth;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return { error: { status: 401, message: 'missing bearer token' } };
  }
  const jwt = header.slice(7);
  const supa = supabaseAnon();
  const { data, error } = await supa.auth.getUser(jwt);
  if (error || !data?.user) {
    return { error: { status: 401, message: 'invalid token' } };
  }
  return {
    user: { id: data.user.id, email: data.user.email ?? null },
    supa: supabaseFromReq(`Bearer ${jwt}`),
  };
}

export async function requireAdmin(
  req: VercelRequest,
): Promise<
  | { user: AuthedUser; supa: SupabaseClient }
  | { error: { status: number; message: string } }
> {
  const r = await requireUser(req);
  if ('error' in r) return r;
  const { data } = await r.supa
    .from('profiles')
    .select('is_admin')
    .eq('id', r.user.id)
    .single();
  const isAdmin = Boolean((data as { is_admin?: boolean } | null)?.is_admin);
  if (!isAdmin) return { error: { status: 403, message: 'admin_required' } };
  return r;
}

// =====================================================================
// Dodo client
// =====================================================================
let _dodo: DodoPayments | null = null;
export function dodoClient(): DodoPayments {
  if (_dodo) return _dodo;
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) throw new Error('DODO_PAYMENTS_API_KEY is not configured');
  const env = process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode';
  _dodo = new DodoPayments({ bearerToken: apiKey, environment: env });
  return _dodo;
}

// =====================================================================
// Plan catalogue — kept identical to apps/api/src/services/billing.ts so
// /api/billing/plans returns the same shape regardless of host.
// =====================================================================
export type Plan = 'free' | 'starter' | 'creator' | 'pro' | 'studio';
export type Currency = 'USD' | 'INR';
export type PlanStatus = 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';

export interface PlanDef {
  key: Plan;
  name: string;
  description: string;
  monthlyPriceUsdCents: number;
  monthlyPriceInrPaise: number;
  monthlyVideoLimit: number;
  maxDurationSeconds: number;
  features: string[];
}

export const PLANS: Record<Plan, PlanDef> = {
  free: {
    key: 'free',
    name: 'Free',
    description: 'Try SnapViral. 2 videos a month. Watermarked output.',
    monthlyPriceUsdCents: 0,
    monthlyPriceInrPaise: 0,
    monthlyVideoLimit: 2,
    maxDurationSeconds: 30,
    features: ['2 videos / month', 'All 3 languages', 'Watermarked', 'Manual publish only'],
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    description: 'For dabbling — 10 videos a month, no watermark.',
    monthlyPriceUsdCents: 1900,
    monthlyPriceInrPaise: 149_900,
    monthlyVideoLimit: 10,
    maxDurationSeconds: 45,
    features: [
      '10 videos / month',
      'All 3 languages',
      'No watermark',
      '45s max duration',
      'Auto-publish to YouTube',
    ],
  },
  creator: {
    key: 'creator',
    name: 'Creator',
    description: 'For shipping daily. 30 videos a month, full automation.',
    monthlyPriceUsdCents: 2900,
    monthlyPriceInrPaise: 249_900,
    monthlyVideoLimit: 30,
    maxDurationSeconds: 60,
    features: [
      '30 videos / month',
      'Auto-publish to YouTube',
      'Live web research',
      'No watermark',
      'Priority queue',
      '60s max duration',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    description: 'For series-level output. 100 videos a month, all bells and whistles.',
    monthlyPriceUsdCents: 4900,
    monthlyPriceInrPaise: 399_900,
    monthlyVideoLimit: 100,
    maxDurationSeconds: 90,
    features: [
      '100 videos / month',
      'Brand kit & custom voices',
      'Long-form (up to 90s)',
      'Multi-channel scheduling',
      'Priority support',
      'All Creator features',
    ],
  },
  studio: {
    key: 'studio',
    name: 'Studio',
    description: 'For agencies running multi-channel.',
    monthlyPriceUsdCents: 9900,
    monthlyPriceInrPaise: 799_900,
    monthlyVideoLimit: 500,
    maxDurationSeconds: 120,
    features: [
      '500 videos / month',
      'Multi-channel auto-publish',
      'Custom voice cloning',
      'Brand kit & API access',
      'White-glove onboarding',
      'Dedicated support',
      'All Pro features',
    ],
  },
};

export function productIdEnvKey(plan: Plan, currency: Currency): string {
  return `DODO_PRODUCT_${plan.toUpperCase()}_${currency}`;
}

export function getProductId(plan: Plan, currency: Currency): string | undefined {
  if (plan === 'free') return undefined;
  return process.env[productIdEnvKey(plan, currency)];
}

// =====================================================================
// Vercel request/response — minimal compatible shape so we don't depend
// on @vercel/node types (avoids extra package install).
// =====================================================================
export interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body: any;
  rawBody?: string | Buffer;
}

export interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  send: (body: unknown) => VercelResponse;
  end: (body?: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
}

// =====================================================================
// Standard JSON error helper
// =====================================================================
export function fail(res: VercelResponse, status: number, message: string): void {
  res.status(status).json({ error: message });
}

// =====================================================================
// Bootstrap helpers used by /api/admin/setup-dodo-products + webhook
// (mirrors apps/api/src/services/billing.ts).
// =====================================================================
export async function createProductsIfMissing(): Promise<{
  created: string[];
  existed: string[];
  envVars: Record<string, string>;
}> {
  const client = dodoClient();
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
      const name = `SnapViral ${def.name} (${currency})`;
      let productId = byName.get(name) ?? byName.get(`Newsflow ${def.name} (${currency})`);

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

  return { created, existed, envVars };
}

export async function registerWebhookIfMissing(args: {
  webhookUrl: string;
}): Promise<{ webhookId: string; secret: string; created: boolean }> {
  const client = dodoClient();

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

  const wh = await (client.webhooks as any).create({
    url: args.webhookUrl,
    description: 'SnapViral billing webhook',
    metadata: {},
    filter_types: wantedEvents,
  });
  return {
    webhookId: (wh as { id: string }).id,
    secret: (wh as { secret: string }).secret,
    created: true,
  };
}
