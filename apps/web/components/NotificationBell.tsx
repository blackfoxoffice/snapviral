import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { Bell, X, Check } from 'lucide-react-native';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../lib/queries';
import type { AppNotification, NotificationKind } from '@newsflow/shared';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

const KIND_COLOR: Record<NotificationKind, string> = {
  announcement: '#0F172A',
  marketing: '#E11D2C',
  promo: '#7C3AED',
  update: '#0EA5E9',
  maintenance: '#F59E0B',
};

const KIND_LABEL: Record<NotificationKind, string> = {
  announcement: 'Announcement',
  marketing: 'Campaign',
  promo: 'Promo',
  update: 'Update',
  maintenance: 'Maintenance',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  // Close dropdown on outside click (web only).
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.('[data-notif-popover]')) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function handleClickItem(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.cta_url) {
      try {
        Linking.openURL(n.cta_url);
      } catch {
        /* noop */
      }
    }
  }

  return (
    <View style={{ position: 'relative' as any, ...({ pointerEvents: 'auto' } as any) } as any}>
      <Pressable
        // @ts-ignore — RN Web passes data attributes through
        data-notif-popover="trigger"
        onPress={() => {
          setOpen((v) => !v);
          if (!open) refetch();
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Bell size={16} color="#27272A" />
        {unread > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              paddingHorizontal: 4,
              backgroundColor: '#E11D2C',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FAFAF7',
            }}
          >
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 9,
                fontWeight: '700',
                color: '#FFFFFF',
                lineHeight: 11,
              }}
            >
              {unread > 9 ? '9+' : unread}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {open ? (
        <View
          // @ts-ignore
          data-notif-popover="panel"
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 380,
            maxWidth: 'calc(100vw - 24px)' as any,
            maxHeight: 480,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: 'rgba(10,10,11,0.10)',
            ...({
              boxShadow: '0 24px 48px -16px rgba(10,10,11,0.18), 0 8px 24px -8px rgba(10,10,11,0.10)',
            } as any),
            zIndex: 100,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(10,10,11,0.06)',
            }}
          >
            <View>
              <Text style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '700', color: '#0A0A0B', letterSpacing: -0.3 }}>
                Notifications
              </Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#71717A', marginTop: 2 }}>
                {unread > 0 ? `${unread} unread` : 'all caught up'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {unread > 0 ? (
                <Pressable
                  onPress={() => markAll.mutate()}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    height: 28,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(10,10,11,0.10)',
                  }}
                >
                  <Check size={11} color="#27272A" />
                  <Text style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: '600', color: '#27272A' }}>
                    Mark all
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={13} color="#52525B" />
              </Pressable>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 400 }}>
            {items.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Bell size={22} color="#A1A1AA" />
                <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: '#52525B', marginTop: 10 }}>
                  No notifications yet
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#A1A1AA', marginTop: 4 }}>
                  We'll let you know when something's worth your time.
                </Text>
              </View>
            ) : (
              items.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => handleClickItem(n)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(10,10,11,0.04)',
                    backgroundColor: n.read ? '#FFFFFF' : 'rgba(225,29,44,0.025)',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginTop: 6,
                      backgroundColor: n.read ? 'transparent' : KIND_COLOR[n.kind],
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 9,
                          fontWeight: '700',
                          color: KIND_COLOR[n.kind],
                          letterSpacing: 1.2,
                          textTransform: 'uppercase',
                        }}
                      >
                        {KIND_LABEL[n.kind]}
                      </Text>
                      <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#A1A1AA' }}>
                        ·
                      </Text>
                      <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#A1A1AA' }}>
                        {timeAgo(n.sent_at ?? n.created_at)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: FONT.sans,
                        fontSize: 13,
                        fontWeight: n.read ? '500' : '700',
                        color: '#0A0A0B',
                        marginBottom: 2,
                        letterSpacing: -0.2,
                      }}
                      numberOfLines={2}
                    >
                      {n.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONT.sans,
                        fontSize: 12,
                        color: '#52525B',
                        lineHeight: 17,
                      }}
                      numberOfLines={3}
                    >
                      {n.body}
                    </Text>
                    {n.cta_label ? (
                      <Text
                        style={{
                          fontFamily: FONT.sans,
                          fontSize: 12,
                          fontWeight: '600',
                          color: KIND_COLOR[n.kind],
                          marginTop: 8,
                        }}
                      >
                        {n.cta_label} →
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}
