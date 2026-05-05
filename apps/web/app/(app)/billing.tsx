import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Check, Sparkles, Zap, Rocket, Crown } from 'lucide-react-native';
import type { Currency, Plan, PlanDef } from '@newsflow/shared';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import {
  usePlans,
  useBillingMe,
  useCreateBillingCheckout,
  useOpenBillingPortal,
} from '../../lib/queries';

const PLAN_ICONS: Record<Plan, any> = {
  free: Sparkles,
  starter: Zap,
  creator: Rocket,
  pro: Crown,
  studio: Crown,
};

const PLAN_ACCENTS: Record<Plan, string> = {
  free: '#64748B',
  starter: '#2563EB',
  creator: '#E53935',
  pro: '#A855F7',
  studio: '#0F172A',
};

/**
 * Auto-detect Indian users:
 *   - Browser locale starts with `en-IN`, `ta-IN`, `hi-IN`, etc.
 *   - OR timezone is Asia/Kolkata.
 * Anything else falls back to USD.
 */
function detectCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'INR';
  } catch {
    // ignore
  }
  const langs = (navigator.languages ?? [navigator.language]).filter(Boolean);
  for (const l of langs) {
    if (l.toUpperCase().endsWith('-IN')) return 'INR';
  }
  return 'USD';
}

function formatPrice(currency: Currency, smallestUnits: number): string {
  if (currency === 'USD') {
    const dollars = smallestUnits / 100;
    return '$' + dollars.toFixed(0);
  }
  // INR — paise → rupees, with thousands sep
  const rupees = smallestUnits / 100;
  return '₹' + rupees.toLocaleString('en-IN');
}

export default function BillingPage() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: me, isLoading: meLoading } = useBillingMe();
  const checkoutMut = useCreateBillingCheckout();
  const portalMut = useOpenBillingPortal();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [currency, setCurrency] = useState<Currency>('USD');

  // Auto-detect once on mount
  useEffect(() => {
    setCurrency(detectCurrency());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      toast.success('Subscription started', 'Your plan should activate within a minute.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handleSubscribe(plan: Plan) {
    if (plan === 'free') return;
    try {
      const { url } = await checkoutMut.mutateAsync({
        plan: plan as Exclude<Plan, 'free'>,
        currency,
      });
      if (typeof window !== 'undefined') window.location.href = url;
    } catch (e) {
      toast.error('Could not start checkout', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleManage() {
    try {
      const { url } = await portalMut.mutateAsync();
      if (typeof window !== 'undefined') window.location.href = url;
    } catch (e) {
      toast.error('Could not open billing portal', e instanceof Error ? e.message : undefined);
    }
  }

  // Order plans for display: free, starter, creator, pro, studio
  const orderedPlans = useMemo(() => {
    if (!plans) return undefined;
    const order: Plan[] = ['free', 'starter', 'creator', 'pro', 'studio'];
    return order.map((k) => plans.find((p) => p.key === k)).filter(Boolean) as PlanDef[];
  }, [plans]);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View
        className="mx-auto w-full max-w-[1200px] pb-20"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: isMobile ? 20 : 32 }}
      >
        <View className={isMobile ? 'mb-6' : 'mb-8'}>
          <Text
            className={`font-bold text-ink ${isMobile ? 'text-[22px]' : 'text-[28px]'} mb-1`}
            style={{ letterSpacing: -0.5 }}
          >
            Billing & plans
          </Text>
          <Text className="text-[13px] text-ink-muted">
            Choose the plan that fits how often you ship.
          </Text>
        </View>

        {meLoading ? (
          <View className="rounded-xl bg-surface-card border border-surface-border p-5 mb-6">
            <ActivityIndicator size="small" color="#E53935" />
          </View>
        ) : me ? (
          <CurrentPlanCard me={me} onManage={handleManage} portalLoading={portalMut.isPending} />
        ) : null}

        {/* Currency toggle */}
        <View className="flex-row items-center justify-center mb-6">
          <View
            className="flex-row p-1 rounded-full"
            style={{ backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7' }}
          >
            {(['USD', 'INR'] as Currency[]).map((c) => (
              <Pressable
                key={c}
                onPress={() => setCurrency(c)}
                className="px-4 py-2 rounded-full"
                style={
                  currency === c
                    ? {
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 1 },
                      }
                    : undefined
                }
              >
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: currency === c ? '#0F172A' : '#64748B' }}
                >
                  {c === 'USD' ? '🌍 USD' : '🇮🇳 INR'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Pricing grid: 5 plans (free + 4 paid). 5-up on desktop, 1-up mobile */}
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {plansLoading || !orderedPlans
            ? [1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  className="rounded-2xl bg-surface-card border border-surface-border p-6"
                  style={{ flex: 1, minWidth: isMobile ? '100%' : 220, minHeight: 460 }}
                >
                  <ActivityIndicator size="small" color="#E53935" />
                </View>
              ))
            : orderedPlans.map((plan) => (
                <View
                  key={plan.key}
                  style={{ flex: 1, minWidth: isMobile ? '100%' : 220, maxWidth: isMobile ? '100%' : 240 }}
                >
                  <PlanCard
                    plan={plan}
                    currency={currency}
                    isCurrent={me?.plan === plan.key}
                    isPaying={me?.has_active_subscription === true && me.plan === plan.key}
                    onSubscribe={() => handleSubscribe(plan.key)}
                    loading={checkoutMut.isPending}
                  />
                </View>
              ))}
        </View>

        <View className="mt-8 items-center">
          <Text className="text-[11px] text-ink-subtle text-center max-w-[480px]">
            Cancel anytime — your plan remains active until the end of the billing period.
            {' '}Indian customers are billed in INR; everyone else in USD.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function CurrentPlanCard({
  me,
  onManage,
  portalLoading,
}: {
  me: { plan: Plan; plan_status: string; current_period_end: string | null; has_active_subscription: boolean; quota: { monthly_video_limit: number; max_duration_seconds: number; used_this_month: number } | null };
  onManage: () => void;
  portalLoading: boolean;
}) {
  const Icon = PLAN_ICONS[me.plan];
  const accent = PLAN_ACCENTS[me.plan];

  const usedPct = me.quota
    ? Math.min(100, Math.round((me.quota.used_this_month / Math.max(me.quota.monthly_video_limit, 1)) * 100))
    : 0;

  return (
    <View
      className="rounded-2xl bg-surface-card border border-surface-border p-5 mb-6"
      style={{ borderColor: '#E4E4E7' }}
    >
      <View className="flex-row items-center gap-3 mb-4">
        <View
          className="items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, backgroundColor: `${accent}1A` }}
        >
          <Icon size={18} color={accent} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[16px] font-bold text-ink uppercase tracking-wide">
              {me.plan}
            </Text>
            {me.plan_status === 'past_due' ? (
              <Badge variant="error">Past due</Badge>
            ) : me.plan_status === 'canceled' ? (
              <Badge variant="neutral">Canceled</Badge>
            ) : me.has_active_subscription ? (
              <Badge variant="success">Active</Badge>
            ) : null}
          </View>
          {me.current_period_end ? (
            <Text className="text-[11px] text-ink-muted mt-0.5">
              Renews{' '}
              {new Date(me.current_period_end).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          ) : null}
        </View>
        {me.has_active_subscription ? (
          <Button variant="secondary" size="sm" onPress={onManage} loading={portalLoading}>
            Manage
          </Button>
        ) : null}
      </View>

      {me.quota ? (
        <View>
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
              Videos this month
            </Text>
            <Text className="text-[12px] text-ink-secondary" style={{ fontVariant: ['tabular-nums'] }}>
              {me.quota.used_this_month} / {me.quota.monthly_video_limit}
            </Text>
          </View>
          <View className="h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: '#F4F4F5' }}>
            <View
              style={{
                width: `${usedPct}%`,
                height: 6,
                backgroundColor: usedPct >= 100 ? '#EF4444' : usedPct >= 80 ? '#F59E0B' : accent,
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function PlanCard({
  plan,
  currency,
  isCurrent,
  isPaying,
  onSubscribe,
  loading,
}: {
  plan: PlanDef;
  currency: Currency;
  isCurrent: boolean;
  isPaying: boolean;
  onSubscribe: () => void;
  loading: boolean;
}) {
  const Icon = PLAN_ICONS[plan.key];
  const accent = PLAN_ACCENTS[plan.key];

  const cents =
    currency === 'USD' ? plan.monthlyPriceUsdCents : plan.monthlyPriceInrPaise;
  const isFeatured = plan.key === 'creator';

  return (
    <Card className={isFeatured ? 'shadow-lg' : ''}>
      <View
        style={{
          padding: 20,
          borderTopWidth: isFeatured ? 3 : 0,
          borderTopColor: accent,
        }}
      >
        <View className="flex-row items-center gap-2 mb-3">
          <View
            className="items-center justify-center rounded-md"
            style={{ width: 24, height: 24, backgroundColor: `${accent}1A` }}
          >
            <Icon size={12} color={accent} />
          </View>
          <Text className="text-[13px] font-bold text-ink uppercase tracking-wide">{plan.name}</Text>
        </View>

        {isFeatured ? (
          <View className="rounded-full px-2 py-0.5 mb-3 self-start" style={{ backgroundColor: accent }}>
            <Text className="text-[9px] font-bold uppercase text-white tracking-widest">Most popular</Text>
          </View>
        ) : (
          <View className="h-4 mb-3" />
        )}

        <Text className="text-[11px] text-ink-muted mb-3" numberOfLines={2}>
          {plan.description}
        </Text>

        <View className="flex-row items-baseline mb-1">
          <Text className="text-[28px] font-bold text-ink" style={{ letterSpacing: -0.8 }}>
            {formatPrice(currency, cents)}
          </Text>
          <Text className="text-[11px] text-ink-muted ml-1">/ mo</Text>
        </View>
        <View className="h-3 mb-4" />

        {isCurrent ? (
          <Button variant="secondary" disabled block size="sm">
            Current plan
          </Button>
        ) : plan.key === 'free' ? (
          <Button variant="secondary" disabled block size="sm">
            Free forever
          </Button>
        ) : (
          <Button
            onPress={onSubscribe}
            loading={loading}
            block
            size="sm"
            variant={isFeatured ? 'primary' : 'secondary'}
          >
            {isPaying ? 'Switch' : `Get ${plan.name}`}
          </Button>
        )}

        <View className="mt-4 gap-2">
          {plan.features.map((f) => (
            <View key={f} className="flex-row items-start gap-2">
              <Check size={11} color={accent} style={{ marginTop: 3 }} />
              <Text className="flex-1 text-[11px] text-ink-secondary leading-relaxed">{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
