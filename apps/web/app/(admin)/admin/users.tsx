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
  Shield,
  Trash2,
  ShieldOff,
  Users as UsersIcon,
  AlertTriangle,
  Mail,
  X,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react-native';
import {
  useAdminUsers,
  useSetUserAdmin,
  useDeleteAdminUser,
} from '../../../lib/queries';
import { useAuth } from '../../../lib/auth';
import { toast } from '../../../components/ui';
import type { AdminUser } from '../../../lib/api';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
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

function initialsFor(u: AdminUser): string {
  const name = (u.full_name ?? u.email ?? '').trim();
  if (!name) return 'U';
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

// Deterministic but varied avatar tint per user.
function avatarColor(id: string): string {
  const palette = [
    '#0F172A', '#7C3AED', '#0EA5E9', '#16A34A', '#F59E0B', '#DC2626',
    '#9333EA', '#1F2937', '#0891B2', '#65A30D', '#EA580C', '#DB2777',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length] ?? palette[0];
}

export default function AdminUsers() {
  const { user: meAuth } = useAuth();
  const { data: users, isLoading, refetch } = useAdminUsers();
  const setAdmin = useSetUserAdmin();
  const removeUser = useDeleteAdminUser();

  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'admins' | 'standard'>('all');
  const [confirmTarget, setConfirmTarget] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    if (!users) return [];
    let out = users;
    if (filter === 'admins') out = out.filter((u) => u.is_admin);
    if (filter === 'standard') out = out.filter((u) => !u.is_admin);
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (u) =>
          (u.email ?? '').toLowerCase().includes(q) ||
          (u.full_name ?? '').toLowerCase().includes(q),
      );
    }
    return out;
  }, [users, query, filter]);

  const total = users?.length ?? 0;
  const adminCount = users?.filter((u) => u.is_admin).length ?? 0;
  const standardCount = total - adminCount;

  async function handleToggleAdmin(u: AdminUser) {
    const willBeAdmin = !u.is_admin;
    if (
      !willBeAdmin &&
      typeof window !== 'undefined' &&
      !window.confirm(`Demote ${u.email} from admin?`)
    )
      return;
    try {
      await setAdmin.mutateAsync({ userId: u.id, isAdmin: willBeAdmin });
      toast.success(
        willBeAdmin ? 'Promoted to admin' : 'Demoted to standard user',
        u.email,
      );
      refetch();
    } catch (e) {
      toast.error('Could not update role', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return;
    try {
      await removeUser.mutateAsync(confirmTarget.id);
      toast.success('User deleted', confirmTarget.email);
      setConfirmTarget(null);
      refetch();
    } catch (e) {
      toast.error('Delete failed', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          maxWidth: 1200,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: isMobile ? 16 : 32,
          paddingTop: 28,
          paddingBottom: 80,
        }}
      >
        {/* Editorial header */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0F172A' }} />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                fontWeight: '700',
                color: '#0F172A',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Identity
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
            Users
          </Text>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 14,
              color: '#52525B',
              maxWidth: 640,
              lineHeight: 22,
            }}
          >
            Every account on this SnapViral instance — promote, demote, and remove. Deleting a
            user purges their auth row, profile, projects and queued topics.
          </Text>
        </View>

        {/* Stat strip */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <Stat label="All users" value={total} accent="#0F172A" Icon={UsersIcon} />
          <Stat label="Admins" value={adminCount} accent="#E11D2C" Icon={Shield} />
          <Stat label="Standard" value={standardCount} accent="#16A34A" Icon={CheckCircle2} />
        </View>

        {/* Toolbar */}
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              height: 42,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.08)',
            }}
          >
            <Search size={14} color="#71717A" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search email or name…"
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
          <View style={{ flexDirection: 'row', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: 'rgba(10,10,11,0.08)' }}>
            {(['all', 'admins', 'standard'] as const).map((f) => {
              const active = filter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    paddingHorizontal: 14,
                    height: 32,
                    borderRadius: 8,
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
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <ActivityIndicator color="#E11D2C" />
          </View>
        ) : filtered.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.10)',
              borderStyle: 'dashed',
              padding: 56,
              alignItems: 'center',
            }}
          >
            <UsersIcon size={26} color="#A1A1AA" />
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 15,
                fontWeight: '700',
                color: '#0A0A0B',
                marginTop: 14,
              }}
            >
              No users match
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: '#71717A', marginTop: 6 }}>
              {query
                ? 'Try a different email or name.'
                : 'Nobody on this SnapViral instance yet.'}
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.08)',
              overflow: 'hidden',
            }}
          >
            {filtered.map((u, i) => (
              <UserRow
                key={u.id}
                user={u}
                last={i === filtered.length - 1}
                isMe={meAuth?.id === u.id}
                onToggleAdmin={() => handleToggleAdmin(u)}
                onDelete={() => setConfirmTarget(u)}
                isMobile={isMobile}
              />
            ))}
          </View>
        )}
      </View>

      {/* Delete confirm modal */}
      {confirmTarget ? (
        <DeleteConfirmModal
          user={confirmTarget}
          loading={removeUser.isPending}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </ScrollView>
  );
}

// =====================================================================
// Row
// =====================================================================
function UserRow({
  user,
  last,
  isMe,
  onToggleAdmin,
  onDelete,
  isMobile,
}: {
  user: AdminUser;
  last: boolean;
  isMe: boolean;
  onToggleAdmin: () => void;
  onDelete: () => void;
  isMobile: boolean;
}) {
  const tint = avatarColor(user.id);
  const name = user.full_name?.trim() || '—';
  return (
    <View
      style={{
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(10,10,11,0.05)',
      }}
    >
      {/* Identity */}
      <View style={{ flex: 2.4, minWidth: 220, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            backgroundColor: tint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 13,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 0.3,
            }}
          >
            {initialsFor(user)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 14,
                fontWeight: '700',
                color: '#0A0A0B',
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isMe ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 8,
                    fontWeight: '700',
                    color: '#9F1239',
                    letterSpacing: 0.8,
                  }}
                >
                  YOU
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Mail size={10} color="#71717A" />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: '#52525B',
              }}
              numberOfLines={1}
            >
              {user.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Project count */}
      <MetaCell
        label="Projects"
        value={user.project_count.toLocaleString()}
        isMobile={isMobile}
      />

      {/* Last sign-in */}
      <MetaCell
        label="Last seen"
        value={timeAgo(user.last_sign_in_at)}
        isMobile={isMobile}
      />

      {/* Joined */}
      <MetaCell label="Joined" value={timeAgo(user.created_at)} isMobile={isMobile} />

      {/* Role pill */}
      <View style={{ width: isMobile ? undefined : 110 }}>
        {user.is_admin ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 9,
              height: 22,
              borderRadius: 6,
              backgroundColor: '#FEE2E2',
              alignSelf: 'flex-start',
            }}
          >
            <Shield size={10} color="#E11D2C" />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                fontWeight: '700',
                color: '#9F1239',
                letterSpacing: 1,
              }}
            >
              ADMIN
            </Text>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 9,
              height: 22,
              borderRadius: 6,
              backgroundColor: '#F4F4F5',
              alignSelf: 'flex-start',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                fontWeight: '700',
                color: '#52525B',
                letterSpacing: 1,
              }}
            >
              STANDARD
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end', marginLeft: isMobile ? 0 : 'auto' }}>
        <Pressable
          onPress={onToggleAdmin}
          disabled={isMe && user.is_admin}
          style={{
            paddingHorizontal: 10,
            height: 30,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(10,10,11,0.10)',
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 5,
            opacity: isMe && user.is_admin ? 0.4 : 1,
          }}
        >
          {user.is_admin ? (
            <>
              <ShieldOff size={11} color="#52525B" />
              <Text style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: '600', color: '#27272A' }}>
                Demote
              </Text>
            </>
          ) : (
            <>
              <Shield size={11} color="#52525B" />
              <Text style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: '600', color: '#27272A' }}>
                Promote
              </Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={isMe || user.is_admin}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isMe || user.is_admin ? 'rgba(10,10,11,0.10)' : '#FECACA',
            backgroundColor: isMe || user.is_admin ? '#FFFFFF' : '#FEF2F2',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isMe || user.is_admin ? 0.35 : 1,
          }}
        >
          <Trash2 size={12} color={isMe || user.is_admin ? '#A1A1AA' : '#DC2626'} />
        </Pressable>
      </View>
    </View>
  );
}

function MetaCell({ label, value, isMobile }: { label: string; value: string; isMobile: boolean }) {
  return (
    <View
      style={{
        width: isMobile ? undefined : 110,
        flexDirection: isMobile ? 'row' : 'column',
        gap: isMobile ? 8 : 0,
        alignItems: isMobile ? 'baseline' : 'flex-start',
      }}
    >
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          fontWeight: '700',
          color: '#A1A1AA',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: isMobile ? 0 : 2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 12,
          fontWeight: '600',
          color: '#27272A',
          fontVariant: ['tabular-nums'] as any,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Stat({
  label,
  value,
  accent,
  Icon,
}: {
  label: string;
  value: number;
  accent: string;
  Icon: any;
}) {
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
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: `${accent}14`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} color={accent} strokeWidth={2.2} />
      </View>
      <View>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 22,
            fontWeight: '700',
            color: '#0A0A0B',
            letterSpacing: -0.5,
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

// =====================================================================
// Delete confirm modal
// =====================================================================
function DeleteConfirmModal({
  user,
  loading,
  onCancel,
  onConfirm,
}: {
  user: AdminUser;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');
  const targetEmail = user.email;
  const matches = typed.trim() === targetEmail;

  return (
    <View
      style={{
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10,10,11,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 100,
        ...({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any),
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 24,
          ...({ boxShadow: '0 30px 60px -15px rgba(10,10,11,0.4)' } as any),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={18} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 18,
                fontWeight: '700',
                color: '#0A0A0B',
                letterSpacing: -0.4,
                marginBottom: 6,
              }}
            >
              Delete this user?
            </Text>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 13,
                lineHeight: 20,
                color: '#52525B',
              }}
            >
              <Text style={{ fontWeight: '700', color: '#0A0A0B' }}>{user.email}</Text>
              {' '}— their auth row, profile, projects ({user.project_count}), queued topics and
              every related record will be permanently removed. This cannot be undone.
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FECACA',
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <ShieldAlert size={13} color="#DC2626" style={{ marginTop: 2 }} />
          <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#7F1D1D', flex: 1, lineHeight: 18 }}>
            Type the user's email to confirm deletion.
          </Text>
        </View>

        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: '700',
            color: '#71717A',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Confirm by typing
          <Text style={{ color: '#DC2626' }}> {targetEmail}</Text>
        </Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          placeholder={targetEmail}
          placeholderTextColor="#A1A1AA"
          autoCapitalize="none"
          autoFocus
          style={{
            fontFamily: FONT.mono,
            fontSize: 13,
            color: '#0A0A0B',
            paddingHorizontal: 14,
            height: 42,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: matches ? '#16A34A' : 'rgba(10,10,11,0.10)',
            backgroundColor: '#FAFAF7',
            marginBottom: 18,
            ...({ outlineStyle: 'none' } as any),
          }}
        />

        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={onCancel}
            disabled={loading}
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
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: '#27272A' }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={!matches || loading}
            style={{
              paddingHorizontal: 16,
              height: 40,
              borderRadius: 10,
              backgroundColor: matches ? '#DC2626' : '#FCA5A5',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Trash2 size={12} color="#FFFFFF" />
                <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  Delete user
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
