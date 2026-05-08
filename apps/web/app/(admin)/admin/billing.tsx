import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Users as UsersIcon,
  TrendingUp,
  Receipt,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import { useAdminBillingOverview, useAdminPayments } from '../../../lib/queries';
import type {
  AdminBillingRow,
  AdminPaymentRow,
  PaymentStatus,
} from '@newsflow/shared';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

function formatMinor(amount: number, currency: string): string {
  const major = amount / 100;
  if (currency === 'INR') return '₹' + major.toLocaleString('en-IN');
  return '$' + major.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const PLAN_PILL_BG: Record<string, string> = {
  free: '#F1F5F9',
  starter: '#DBEAFE',
  creator: '#FEE2E2',
  pro: '#EDE9FE',
  studio: '#0F172A',
};
const PLAN_PILL_TEXT: Record<string, string> = {
  free: '#475569',
  starter: '#1D4ED8',
  creator: '#9F1239',
  pro: '#6D28D9',
  studio: '#FFFFFF',
};

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  active: { bg: 'rgba(22,163,74,0.10)', fg: '#16A34A' },
  trialing: { bg: 'rgba(59,130,246,0.10)', fg: '#2563EB' },
  past_due: { bg: 'rgba(220,38,38,0.10)', fg: '#DC2626' },
  paused: { bg: 'rgba(245,158,11,0.10)', fg: '#D97706' },
  canceled: { bg: '#F1F5F9', fg: '#64748B' },
};

export default function AdminBilling() {
  const { width } = useWindowDimensions();
  const isMobile = width < 1100;

  const overview = useAdminBillingOverview();
  const payments = useAdminPayments({ limit: 100 });

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'past_due' | 'canceled'>('all');

  const rows = overview.data?.rows ?? [];
  const totals = overview.data?.totals;

  const filtered = useMemo(() => {
    let out = rows;
    if (filter === 'paid') out = out.filter((r) => r.plan !== 'free' && r.plan_status === 'active');
    if (filter === 'past_due') out = out.filter((r) => r.plan_status === 'past_due');
    if (filter === 'canceled') out = out.filter((r) => r.plan_status === 'canceled');
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          (r.email ?? '').toLowerCase().includes(q) ||
          (r.full_name ?? '').toLowerCase().includes(q) ||
          (r.plan ?? '').toLowerCase().includes(q),
      );
    }
    return out;
  }, [rows, query, filter]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F6F7F9' }}>
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: isMobile ? 16 : 32,
          paddingTop: 28,
          paddingBottom: 80,
          gap: 24,
        }}
      >
        {/* Editorial header */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E11D2C' }} />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                fontWeight: '700',
                color: '#E11D2C',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Billing
            </Text>
          </View>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 26 : 34,
              fontWeight: '700',
              color: '#0A0A0B',
              letterSpacing: -1.2,
              marginBottom: 6,
            }}
          >
            Subscriptions & receipts
          </Text>
          <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: '#52525B', maxWidth: 640, lineHeight: 22 }}>
            Live view of every paid customer, their plan tier, current usage and the entire
            payment history captured from Dodo Payments webhooks.
          </Text>
        </View>

        {/* KPI strip */}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <Kpi
            label="Active paid"
            value={totals?.activePaid ?? 0}
            accent="#16A34A"
            Icon={CheckCircle2}
            isMobile={isMobile}
          />
          <Kpi
            label="Past due"
            value={totals?.pastDue ?? 0}
            accent="#DC2626"
            Icon={AlertTriangle}
            isMobile={isMobile}
          />
          <Kpi
            label="Canceled"
            value={totals?.canceled ?? 0}
            accent="#64748B"
            Icon={UsersIcon}
            isMobile={isMobile}
          />
          <Kpi
            label="Last 30d · USD"
            value={
              totals
                ? `$${(totals.last30dUsdMinor / 100).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`
                : '$0'
            }
            accent="#0F172A"
            Icon={TrendingUp}
            isMobile={isMobile}
          />
          <Kpi
            label="Last 30d · INR"
            value={
              totals
                ? `₹${(totals.last30dInrMinor / 100).toLocaleString('en-IN')}`
                : '₹0'
            }
            accent="#7C3AED"
            Icon={TrendingUp}
            isMobile={isMobile}
          />
        </View>

        {/* Subscriptions table */}
        <Section title="Subscriptions" subtitle="One row per user — plan, status and lifetime spend.">
          <View
            style={{
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.08)',
              }}
            >
              <Search size={13} color="#71717A" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search email, name or plan…"
                placeholderTextColor="#A1A1AA"
                style={{
                  flex: 1,
                  fontFamily: FONT.sans,
                  fontSize: 13,
                  color: '#0A0A0B',
                  ...({ outlineStyle: 'none' } as any),
                }}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')}>
                  <X size={13} color="#71717A" />
                </Pressable>
              ) : null}
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: 4,
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                padding: 4,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.08)',
              }}
            >
              {(['all', 'paid', 'past_due', 'canceled'] as const).map((f) => {
                const active = filter === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={{
                      paddingHorizontal: 12,
                      height: 30,
                      borderRadius: 7,
                      backgroundColor: active ? '#0A0A0B' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONT.sans,
                        fontSize: 12,
                        fontWeight: '600',
                        color: active ? '#FFFFFF' : '#52525B',
                        textTransform: 'capitalize',
                      }}
                    >
                      {f === 'past_due' ? 'past due' : f}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {overview.isLoading ? (
            <View style={{ padding: 60, alignItems: 'center' }}>
              <ActivityIndicator color="#E11D2C" />
            </View>
          ) : filtered.length === 0 ? (
            <Empty Icon={CreditCard} title="No subscriptions" body="No users match the current filter." />
          ) : (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.08)',
                overflow: 'hidden',
              }}
            >
              {filtered.map((r, i) => (
                <BillingRow key={r.user_id} row={r} last={i === filtered.length - 1} isMobile={isMobile} />
              ))}
            </View>
          )}
        </Section>

        {/* Recent payments */}
        <Section title="Recent payments" subtitle="Last 100 events received from Dodo. Live as the webhook fires.">
          {payments.isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#E11D2C" />
            </View>
          ) : (payments.data?.payments ?? []).length === 0 ? (
            <Empty
              Icon={Receipt}
              title="No payments yet"
              body="Receipts will appear here automatically the moment a charge clears."
            />
          ) : (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.08)',
                overflow: 'hidden',
              }}
            >
              {(payments.data?.payments ?? []).map((p, i, arr) => (
                <PaymentRow key={p.id} payment={p} last={i === arr.length - 1} isMobile={isMobile} />
              ))}
            </View>
          )}
        </Section>
      </View>
    </ScrollView>
  );
}

// =====================================================================
// Sections
// =====================================================================
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 18,
            fontWeight: '700',
            color: '#0A0A0B',
            letterSpacing: -0.4,
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#71717A' }}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

// =====================================================================
// Subscription row
// =====================================================================
function BillingRow({
  row,
  last,
  isMobile,
}: {
  row: AdminBillingRow;
  last: boolean;
  isMobile: boolean;
}) {
  const planBg = PLAN_PILL_BG[row.plan] ?? '#F1F5F9';
  const planFg = PLAN_PILL_TEXT[row.plan] ?? '#52525B';
  const statusMeta = STATUS_COLOR[row.plan_status] ?? STATUS_COLOR.active;

  const usagePct =
    row.monthly_video_limit > 0
      ? Math.min(100, Math.round((row.used_this_month / row.monthly_video_limit) * 100))
      : 0;

  return (
    <View
      style={{
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(15,23,42,0.05)',
      }}
    >
      {/* Identity */}
      <View style={{ flex: 2.4, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 14,
            fontWeight: '700',
            color: '#0A0A0B',
            letterSpacing: -0.2,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {row.full_name?.trim() || row.email}
        </Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: '#52525B' }} numberOfLines={1}>
          {row.email}
        </Text>
      </View>

      {/* Plan pill */}
      <View
        style={{
          paddingHorizontal: 9,
          height: 22,
          borderRadius: 5,
          backgroundColor: planBg,
          alignSelf: isMobile ? 'flex-start' : 'auto',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            fontWeight: '700',
            color: planFg,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {row.plan ?? 'free'}
        </Text>
      </View>

      {/* Status */}
      <View
        style={{
          paddingHorizontal: 9,
          height: 22,
          borderRadius: 5,
          backgroundColor: statusMeta.bg,
          alignSelf: isMobile ? 'flex-start' : 'auto',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            fontWeight: '700',
            color: statusMeta.fg,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {row.plan_status.replace('_', ' ')}
        </Text>
      </View>

      {/* Usage */}
      <View style={{ width: isMobile ? undefined : 160 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 4,
          }}
        >
          <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#71717A', letterSpacing: 0.8 }}>
            USAGE
          </Text>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 11,
              fontWeight: '600',
              color: '#0A0A0B',
              fontVariant: ['tabular-nums'] as any,
            }}
          >
            {row.used_this_month} / {row.monthly_video_limit || '∞'}
          </Text>
        </View>
        <View
          style={{
            height: 4,
            borderRadius: 999,
            backgroundColor: '#F1F5F9',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${usagePct}%`,
              height: 4,
              borderRadius: 999,
              backgroundColor:
                usagePct > 95 ? '#DC2626' : usagePct > 80 ? '#D97706' : '#16A34A',
            }}
          />
        </View>
      </View>

      {/* Spend */}
      <View style={{ width: isMobile ? undefined : 130 }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#71717A', letterSpacing: 0.8, marginBottom: 2 }}>
          LIFETIME
        </Text>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 13,
            fontWeight: '700',
            color: '#0A0A0B',
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {formatMinor(row.lifetime_usd_minor, 'USD')}
          {row.lifetime_inr_minor > 0 ? ` · ${formatMinor(row.lifetime_inr_minor, 'INR')}` : ''}
        </Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#71717A', marginTop: 2 }}>
          {row.payment_count} payment{row.payment_count === 1 ? '' : 's'}
        </Text>
      </View>

      {/* Renews */}
      <View style={{ width: isMobile ? undefined : 130 }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#71717A', letterSpacing: 0.8, marginBottom: 2 }}>
          {row.plan_status === 'canceled' ? 'CANCELED' : 'NEXT BILL'}
        </Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#27272A', fontWeight: '500' }}>
          {row.current_period_end
            ? new Date(row.current_period_end).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—'}
        </Text>
      </View>
    </View>
  );
}

// =====================================================================
// Payment row
// =====================================================================
function PaymentRow({
  payment,
  last,
  isMobile,
}: {
  payment: AdminPaymentRow;
  last: boolean;
  isMobile: boolean;
}) {
  const status: PaymentStatus = payment.status;
  const StatusIcon =
    status === 'succeeded'
      ? CheckCircle2
      : status === 'refunded'
        ? RefreshCw
        : status === 'pending'
          ? AlertCircle
          : AlertCircle;
  const statusColor =
    status === 'succeeded'
      ? '#16A34A'
      : status === 'refunded'
        ? '#0EA5E9'
        : status === 'pending'
          ? '#D97706'
          : '#DC2626';
  const statusBg =
    status === 'succeeded'
      ? 'rgba(22,163,74,0.10)'
      : status === 'refunded'
        ? 'rgba(14,165,233,0.10)'
        : status === 'pending'
          ? 'rgba(245,158,11,0.10)'
          : 'rgba(220,38,38,0.10)';
  return (
    <View
      style={{
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(15,23,42,0.05)',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          backgroundColor: statusBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StatusIcon size={15} color={statusColor} />
      </View>
      <View style={{ flex: 2, minWidth: 0 }}>
        <Text
          style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '700', color: '#0A0A0B' }}
          numberOfLines={1}
        >
          {payment.email ?? '—'}
        </Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#71717A', marginTop: 2 }} numberOfLines={1}>
          {payment.dodo_payment_id ?? payment.id}
        </Text>
      </View>
      <View style={{ width: isMobile ? undefined : 100 }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#71717A', letterSpacing: 0.8 }}>STATUS</Text>
        <View
          style={{
            paddingHorizontal: 8,
            height: 20,
            borderRadius: 5,
            backgroundColor: statusBg,
            alignSelf: 'flex-start',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 3,
          }}
        >
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: '700',
              color: statusColor,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {status}
          </Text>
        </View>
      </View>
      <View style={{ width: isMobile ? undefined : 110 }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#71717A', letterSpacing: 0.8 }}>AMOUNT</Text>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 13,
            fontWeight: '700',
            color: '#0A0A0B',
            marginTop: 3,
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {formatMinor(payment.amount_minor, payment.currency)}
        </Text>
      </View>
      <View style={{ width: isMobile ? undefined : 130 }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#71717A', letterSpacing: 0.8 }}>WHEN</Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#27272A', marginTop: 3, fontWeight: '500' }}>
          {timeAgo(payment.occurred_at)}
        </Text>
      </View>
      {payment.receipt_url || payment.invoice_url ? (
        <Pressable
          onPress={() => {
            const url = payment.receipt_url ?? payment.invoice_url ?? '';
            if (typeof window !== 'undefined' && url) window.open(url, '_blank');
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            height: 30,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(15,23,42,0.10)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Text style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: '600', color: '#27272A' }}>
            Receipt
          </Text>
          <ExternalLink size={11} color="#475569" />
        </Pressable>
      ) : null}
    </View>
  );
}

// =====================================================================
// KPI tile
// =====================================================================
function Kpi({
  label,
  value,
  accent,
  Icon,
  isMobile,
}: {
  label: string;
  value: number | string;
  accent: string;
  Icon: any;
  isMobile: boolean;
}) {
  return (
    <View
      style={{
        flexBasis: isMobile ? '47%' : '18%',
        flexGrow: 1,
        minWidth: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.08)',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          backgroundColor: `${accent}14`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={15} color={accent} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 22,
            fontWeight: '700',
            color: '#0A0A0B',
            letterSpacing: -0.5,
            fontVariant: ['tabular-nums'] as any,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: '700',
            color: '#71717A',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function Empty({ Icon, title, body }: { Icon: any; title: string; body: string }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(15,23,42,0.10)',
        padding: 48,
        alignItems: 'center',
      }}
    >
      <Icon size={26} color="#A1A1AA" />
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 14,
          fontWeight: '700',
          color: '#0A0A0B',
          marginTop: 12,
        }}
      >
        {title}
      </Text>
      <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#71717A', marginTop: 4, textAlign: 'center' }}>
        {body}
      </Text>
    </View>
  );
}
