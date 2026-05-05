import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Check, ExternalLink, Sparkles, Zap, Crown } from 'lucide-react-native';
import type { Plan, PlanDef } from '@newsflow/shared';
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
  creator: Zap,
  studio: Crown,
};

const PLAN_ACCENTS: Record<Plan, string> = {
  free: '#64748B',
  creator: '#E53935',
  studio: '#A855F7',
};

export default function BillingPage() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: me, isLoading: meLoading } = useBillingMe();
  const checkoutMut = useCreateBillingCheckout();
  const portalMut = useOpenBillingPortal();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');

  // After checkout success, Dodo bounces back to ?checkout=success
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
      const { url } = await checkoutMut.mutateAsync({ plan, interval });
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

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View
        className="mx-auto w-full max-w-[1100px] pb-20"
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

        {/* Current plan card */}
        {meLoading ? (
          <View className="rounded-xl bg-surface-card border border-surface-border p-5 mb-6">
            <ActivityIndicator size="small" color="#E53935" />
          </View>
        ) : me ? (
          <CurrentPlanCard me={me} onManage={handleManage} portalLoading={portalMut.isPending} />
        ) : null}

        {/* Interval toggle */}
        <View className="flex-row items-center justify-center mb-6">
          <View
            className="flex-row p-1 rounded-full"
            style={{ backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7' }}
          >
            <Pressable
              onPress={() => setInterval('monthly')}
              className="px-4 py-2 rounded-full"
              style={interval === 'monthly' ? { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } } : undefined}
            >
              <Text className="text-[12px] font-semibold" style={{ color: interval === 'monthly' ? '#0F172A' : '#64748B' }}>
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setInterval('annual')}
              className="flex-row items-center gap-2 px-4 py-2 rounded-full"
              style={interval === 'annual' ? { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } } : undefined}
            >
              <Text className="text-[12px] font-semibold" style={{ color: interval === 'annual' ? '#0F172A' : '#64748B' }}>
                Annual
              </Text>
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(0,200,83,0.15)' }}>
                <Text className="text-[10px] font-bold" style={{ color: '#00C853' }}>2 mo free</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Pricing cards */}
        <View className={`gap-4 ${isMobile ? '' : 'flex-row'}`}>
          {plansLoading || !plans
            ? [1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="rounded-2xl bg-surface-card border border-surface-border p-6"
                  style={{ flex: 1, minHeight: 380 }}
                >
                  <ActivityIndicator size="small" color="#E53935" />
                </View>
              ))
            : plans.map((plan) => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  interval={interval}
                  isCurrent={me?.plan === plan.key}
                  isPaying={me?.has_active_subscription === true && me.plan === plan.key}
                  onSubscribe={() => handleSubscribe(plan.key)}
                  loading={checkoutMut.isPending}
                />
              ))}
        </View>

        <View className="mt-8 items-center">
          <Text className="text-[11px] text-ink-subtle text-center max-w-[480px]">
            Prices in USD. Charges happen in your local currency at checkout.
            Cancel anytime — your plan remains active until the end of the billing period.
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
              Renews {new Date(me.current_period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
  interval,
  isCurrent,
  isPaying,
  onSubscribe,
  loading,
}: {
  plan: PlanDef;
  interval: 'monthly' | 'annual';
  isCurrent: boolean;
  isPaying: boolean;
  onSubscribe: () => void;
  loading: boolean;
}) {
  const Icon = PLAN_ICONS[plan.key];
  const accent = PLAN_ACCENTS[plan.key];

  const cents = interval === 'monthly' ? plan.monthlyPriceCents : plan.annualPriceCents;
  const monthlyEquivalent = interval === 'annual' ? Math.round(cents / 12) : cents;
  const isFeatured = plan.key === 'creator';

  return (
    <Card className={isFeatured ? 'shadow-lg' : ''}>
      <View
        style={{
          padding: 24,
          borderTopWidth: isFeatured ? 3 : 0,
          borderTopColor: accent,
        }}
      >
        <View className="flex-row items-center gap-2 mb-4">
          <View
            className="items-center justify-center rounded-md"
            style={{ width: 28, height: 28, backgroundColor: `${accent}1A` }}
          >
            <Icon size={14} color={accent} />
          </View>
          <Text className="text-[14px] font-bold text-ink uppercase tracking-wide">{plan.name}</Text>
          {isFeatured ? (
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: accent }}>
              <Text className="text-[9px] font-bold uppercase text-white tracking-widest">Most popular</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-[12px] text-ink-muted mb-4">{plan.description}</Text>

        <View className="flex-row items-baseline mb-1">
          <Text className="text-[36px] font-bold text-ink" style={{ letterSpacing: -1 }}>
            ${(monthlyEquivalent / 100).toFixed(0)}
          </Text>
          <Text className="text-[13px] text-ink-muted ml-1">/ month</Text>
        </View>
        {interval === 'annual' && plan.annualPriceCents > 0 ? (
          <Text className="text-[11px] text-ink-subtle mb-5">
            ${(plan.annualPriceCents / 100).toFixed(0)} billed yearly
          </Text>
        ) : (
          <View className="h-4 mb-5" />
        )}

        {isCurrent ? (
          <Button variant="secondary" disabled block>
            Current plan
          </Button>
        ) : plan.key === 'free' ? (
          <Button variant="secondary" disabled block>
            Free forever
          </Button>
        ) : (
          <Button
            onPress={onSubscribe}
            loading={loading}
            block
            variant={isFeatured ? 'primary' : 'secondary'}
          >
            {isPaying ? 'Switch to this plan' : `Get ${plan.name}`}
          </Button>
        )}

        <View className="mt-5 gap-2">
          {plan.features.map((f) => (
            <View key={f} className="flex-row items-start gap-2">
              <Check size={13} color={accent} style={{ marginTop: 3 }} />
              <Text className="flex-1 text-[12px] text-ink-secondary leading-relaxed">{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
