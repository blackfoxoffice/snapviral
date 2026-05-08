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
  Bell,
  Send,
  Trash2,
  Megaphone,
  Sparkles,
  Tag,
  Wrench,
  Info,
  Users,
  Globe2,
  CreditCard,
  Shield,
  CheckCircle2,
} from 'lucide-react-native';
import {
  useAdminNotifications,
  useCreateAdminNotification,
  useDeleteAdminNotification,
  useSendAdminNotification,
} from '../../../lib/queries';
import { toast } from '../../../components/ui';
import type { AppNotification, NotificationAudience, NotificationKind } from '@newsflow/shared';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

const KIND_OPTIONS: Array<{ value: NotificationKind; label: string; Icon: any; color: string }> = [
  { value: 'announcement', label: 'Announcement', Icon: Info, color: '#0F172A' },
  { value: 'marketing', label: 'Marketing', Icon: Megaphone, color: '#E11D2C' },
  { value: 'promo', label: 'Promo', Icon: Tag, color: '#7C3AED' },
  { value: 'update', label: 'Product update', Icon: Sparkles, color: '#0EA5E9' },
  { value: 'maintenance', label: 'Maintenance', Icon: Wrench, color: '#F59E0B' },
];

const AUDIENCE_OPTIONS: Array<{ value: NotificationAudience; label: string; Icon: any }> = [
  { value: 'all', label: 'Everyone', Icon: Globe2 },
  { value: 'paid', label: 'Paid plans', Icon: CreditCard },
  { value: 'free', label: 'Free plan', Icon: Users },
  { value: 'admins', label: 'Admins only', Icon: Shield },
];

export default function AdminNotifications() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const { data, isLoading, refetch } = useAdminNotifications();
  const create = useCreateAdminNotification();
  const send = useSendAdminNotification();
  const remove = useDeleteAdminNotification();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<NotificationKind>('announcement');
  const [audience, setAudience] = useState<NotificationAudience>('all');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  const notifications = data?.notifications ?? [];
  const sentCount = notifications.filter((n) => n.sent_at).length;
  const draftCount = notifications.filter((n) => !n.sent_at).length;
  const totalReads = notifications.reduce((sum, n) => sum + (n.read_count ?? 0), 0);

  const kindMeta = useMemo(() => KIND_OPTIONS.find((k) => k.value === kind)!, [kind]);

  function reset() {
    setTitle('');
    setBody('');
    setKind('announcement');
    setAudience('all');
    setCtaLabel('');
    setCtaUrl('');
  }

  async function handleCompose(sendNow: boolean) {
    if (!title.trim() || !body.trim()) {
      toast.error('Both title and body are required');
      return;
    }
    try {
      await create.mutateAsync({
        title,
        body,
        kind,
        audience,
        cta_label: ctaLabel.trim() || null,
        cta_url: ctaUrl.trim() || null,
        send_now: sendNow,
      });
      toast.success(sendNow ? 'Notification sent' : 'Draft saved');
      reset();
      refetch();
    } catch (e) {
      toast.error('Could not save', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleSend(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Send this notification to selected audience now?'))
      return;
    try {
      await send.mutateAsync(id);
      toast.success('Notification sent');
      refetch();
    } catch (e) {
      toast.error('Send failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleDelete(id: string, t: string) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${t}"? This cannot be undone.`))
      return;
    try {
      await remove.mutateAsync(id);
      toast.success('Deleted');
      refetch();
    } catch (e) {
      toast.error('Delete failed', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#FAFAF7' }}>
      <View
        className="mx-auto w-full"
        style={{
          maxWidth: 1200,
          paddingHorizontal: isMobile ? 16 : 32,
          paddingTop: 28,
          paddingBottom: 80,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
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
              Broadcast
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
            Push notifications
          </Text>
          <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: '#52525B', maxWidth: 640, lineHeight: 22 }}>
            Compose marketing campaigns, promotional pushes and product updates. Notifications land
            in every targeted user's in-app inbox the moment you send.
          </Text>
        </View>

        {/* Stats strip */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          <StatTile label="Sent" value={sentCount} accent="#16A34A" />
          <StatTile label="Drafts" value={draftCount} accent="#F59E0B" />
          <StatTile label="Total reads" value={totalReads} accent="#0F172A" />
        </View>

        {/* Compose + preview row */}
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: 24,
            marginBottom: 40,
          }}
        >
          {/* Compose form */}
          <View style={{ flex: isMobile ? undefined : 1.4 }}>
            <ComposeCard>
              <SectionLabel>Title</SectionLabel>
              <Input value={title} onChangeText={setTitle} placeholder="Big new feature is live" />

              <SectionLabel marginTop>Message</SectionLabel>
              <Input
                value={body}
                onChangeText={setBody}
                placeholder="Describe what's new in 1–2 sentences."
                multiline
                minHeight={92}
              />

              <SectionLabel marginTop>Type</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {KIND_OPTIONS.map((opt) => {
                  const active = kind === opt.value;
                  const Icon = opt.Icon;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setKind(opt.value)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        height: 34,
                        borderRadius: 999,
                        backgroundColor: active ? `${opt.color}14` : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: active ? opt.color : 'rgba(10,10,11,0.10)',
                      }}
                    >
                      <Icon size={12} color={active ? opt.color : '#52525B'} />
                      <Text
                        style={{
                          fontFamily: FONT.sans,
                          fontSize: 12,
                          fontWeight: active ? '600' : '500',
                          color: active ? opt.color : '#27272A',
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <SectionLabel marginTop>Audience</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {AUDIENCE_OPTIONS.map((opt) => {
                  const active = audience === opt.value;
                  const Icon = opt.Icon;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setAudience(opt.value)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        height: 34,
                        borderRadius: 999,
                        backgroundColor: active ? '#0A0A0B' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: active ? '#0A0A0B' : 'rgba(10,10,11,0.10)',
                      }}
                    >
                      <Icon size={12} color={active ? '#FFFFFF' : '#52525B'} />
                      <Text
                        style={{
                          fontFamily: FONT.sans,
                          fontSize: 12,
                          fontWeight: '600',
                          color: active ? '#FFFFFF' : '#27272A',
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 160 }}>
                  <SectionLabel>CTA label (optional)</SectionLabel>
                  <Input value={ctaLabel} onChangeText={setCtaLabel} placeholder="See what's new" />
                </View>
                <View style={{ flex: 1, minWidth: 160 }}>
                  <SectionLabel>CTA URL (optional)</SectionLabel>
                  <Input value={ctaUrl} onChangeText={setCtaUrl} placeholder="https://..." />
                </View>
              </View>

              {/* Action buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 24,
                  paddingTop: 20,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(10,10,11,0.06)',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                <Pressable
                  onPress={() => handleCompose(false)}
                  disabled={create.isPending}
                  style={{
                    paddingHorizontal: 16,
                    height: 40,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(10,10,11,0.10)',
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT.sans,
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#27272A',
                    }}
                  >
                    Save as draft
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleCompose(true)}
                  disabled={create.isPending}
                  style={{
                    paddingHorizontal: 18,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#E11D2C',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Send size={13} color="#FFFFFF" />
                  <Text
                    style={{
                      fontFamily: FONT.sans,
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}
                  >
                    {create.isPending ? 'Sending…' : 'Send now'}
                  </Text>
                </Pressable>
              </View>
            </ComposeCard>
          </View>

          {/* Live phone preview */}
          <View
            style={{
              flex: isMobile ? undefined : 1,
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <PhonePreview
              title={title || 'Big new feature is live'}
              body={body || 'Describe what\'s new in 1–2 sentences. Users see this in their notification tray.'}
              kindMeta={kindMeta}
              ctaLabel={ctaLabel}
            />
          </View>
        </View>

        {/* Past notifications list */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 17,
                fontWeight: '700',
                color: '#0A0A0B',
                letterSpacing: -0.4,
              }}
            >
              Past broadcasts
            </Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: '#71717A' }}>
              {notifications.length} total
            </Text>
          </View>

          {isLoading ? (
            <View style={{ padding: 60, alignItems: 'center' }}>
              <ActivityIndicator color="#E11D2C" />
            </View>
          ) : notifications.length === 0 ? (
            <EmptyList />
          ) : (
            <View
              style={{
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: 'rgba(10,10,11,0.08)',
                overflow: 'hidden',
              }}
            >
              {notifications.map((n, i) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  last={i === notifications.length - 1}
                  onSend={() => handleSend(n.id)}
                  onDelete={() => handleDelete(n.id, n.title)}
                  isSending={send.isPending}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// =====================================================================
// Phone preview
// =====================================================================
function PhonePreview({
  title,
  body,
  kindMeta,
  ctaLabel,
}: {
  title: string;
  body: string;
  kindMeta: { value: NotificationKind; label: string; Icon: any; color: string };
  ctaLabel: string;
}) {
  const KIcon = kindMeta.Icon;
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          color: '#71717A',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        Live preview
      </Text>
      <View
        style={{
          width: 280,
          aspectRatio: 9 / 19,
          borderRadius: 36,
          padding: 10,
          backgroundColor: '#0A0A0B',
          ...({
            boxShadow: '0 30px 60px -30px rgba(10,10,11,0.45), 0 0 0 1px rgba(10,10,11,0.08)',
          } as any),
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 28,
            overflow: 'hidden',
            backgroundColor: '#0A0A0B',
            ...({
              backgroundImage:
                'linear-gradient(180deg, #18181B 0%, #0A0A0B 40%, #18181B 100%)',
            } as any),
          }}
        >
          {/* Notch */}
          <View
            style={{
              alignItems: 'center',
              paddingTop: 12,
            }}
          >
            <View
              style={{
                width: 86,
                height: 22,
                borderRadius: 999,
                backgroundColor: '#000',
              }}
            />
          </View>

          {/* Time */}
          <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 14 }}>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 56,
                fontWeight: '300',
                color: '#FFFFFF',
                letterSpacing: -3,
                lineHeight: 56,
              }}
            >
              9:41
            </Text>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 13,
                fontWeight: '500',
                color: 'rgba(255,255,255,0.7)',
                marginTop: 4,
              }}
            >
              Wednesday, May 8
            </Text>
          </View>

          {/* Notification card */}
          <View style={{ paddingHorizontal: 12, marginTop: 6 }}>
            <View
              style={{
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.10)',
                ...({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any),
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.10)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    backgroundColor: '#E11D2C',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell size={12} color="#FFFFFF" />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: FONT.sans,
                    fontSize: 11,
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                  numberOfLines={1}
                >
                  SnapViral
                </Text>
                <Text style={{ fontFamily: FONT.sans, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
                  now
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: FONT.sans,
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  letterSpacing: -0.3,
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontFamily: FONT.sans,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 17,
                }}
                numberOfLines={4}
              >
                {body}
              </Text>
              {ctaLabel ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <KIcon size={11} color="#FF6B7A" />
                  <Text
                    style={{
                      fontFamily: FONT.sans,
                      fontSize: 11,
                      fontWeight: '600',
                      color: '#FF6B7A',
                    }}
                  >
                    {ctaLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          color: '#71717A',
          textAlign: 'center',
          maxWidth: 240,
          marginTop: 8,
        }}
      >
        Lock-screen preview · how it appears on a {kindMeta.label.toLowerCase()} push
      </Text>
    </View>
  );
}

// =====================================================================
// Past notifications row
// =====================================================================
function NotificationRow({
  n,
  last,
  onSend,
  onDelete,
  isSending,
}: {
  n: AppNotification;
  last: boolean;
  onSend: () => void;
  onDelete: () => void;
  isSending: boolean;
}) {
  const kindMeta = KIND_OPTIONS.find((k) => k.value === n.kind) ?? KIND_OPTIONS[0];
  const KIcon = kindMeta.Icon;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(10,10,11,0.06)',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: `${kindMeta.color}14`,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        <KIcon size={15} color={kindMeta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 14,
              fontWeight: '700',
              color: '#0A0A0B',
              letterSpacing: -0.3,
            }}
          >
            {n.title}
          </Text>
          <View
            style={{
              paddingHorizontal: 7,
              height: 18,
              borderRadius: 4,
              backgroundColor: n.sent_at ? 'rgba(22,163,74,0.10)' : 'rgba(245,158,11,0.10)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                fontWeight: '700',
                color: n.sent_at ? '#16A34A' : '#D97706',
                letterSpacing: 0.5,
              }}
            >
              {n.sent_at ? 'SENT' : 'DRAFT'}
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#71717A' }}>
            · {n.audience}
          </Text>
        </View>
        <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: '#52525B', lineHeight: 19 }} numberOfLines={2}>
          {n.body}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#71717A' }}>
            {n.sent_at
              ? `sent ${new Date(n.sent_at).toLocaleString()}`
              : `drafted ${new Date(n.created_at).toLocaleString()}`}
          </Text>
          {n.read_count !== undefined ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={10} color="#16A34A" />
              <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#16A34A', fontWeight: '600' }}>
                {n.read_count} read
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {!n.sent_at ? (
          <Pressable
            onPress={onSend}
            disabled={isSending}
            style={{
              paddingHorizontal: 12,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#E11D2C',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 5,
            }}
          >
            <Send size={11} color="#FFFFFF" />
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>
              Send
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDelete}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(10,10,11,0.10)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trash2 size={12} color="#DC2626" />
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// Atoms
// =====================================================================
function ComposeCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(10,10,11,0.08)',
        padding: 24,
      }}
    >
      {children}
    </View>
  );
}

function SectionLabel({ children, marginTop }: { children: React.ReactNode; marginTop?: boolean }) {
  return (
    <Text
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: '700',
        color: '#71717A',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: marginTop ? 18 : 0,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function Input({
  value,
  onChangeText,
  placeholder,
  multiline,
  minHeight,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#A1A1AA"
      multiline={multiline}
      style={{
        fontFamily: FONT.sans,
        fontSize: 14,
        color: '#0A0A0B',
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(10,10,11,0.10)',
        backgroundColor: '#FAFAF7',
        minHeight: multiline ? minHeight ?? 80 : 42,
        textAlignVertical: multiline ? ('top' as any) : undefined,
        ...({ outlineStyle: 'none' } as any),
      }}
    />
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View
      style={{
        flexBasis: '30%',
        flexGrow: 1,
        minWidth: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(10,10,11,0.08)',
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: `${accent}14`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={16} color={accent} />
      </View>
      <View>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 26,
            fontWeight: '700',
            color: '#0A0A0B',
            letterSpacing: -0.8,
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {value.toLocaleString()}
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

function EmptyList() {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(10,10,11,0.10)',
        backgroundColor: '#FFFFFF',
        padding: 56,
        alignItems: 'center',
      }}
    >
      <Bell size={28} color="#A1A1AA" />
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 15,
          fontWeight: '700',
          color: '#0A0A0B',
          marginTop: 14,
        }}
      >
        No broadcasts yet
      </Text>
      <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: '#71717A', marginTop: 6 }}>
        Compose your first push notification above.
      </Text>
    </View>
  );
}
