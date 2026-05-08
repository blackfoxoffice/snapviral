import { View, Text, ScrollView, Pressable, useWindowDimensions, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { LogOut, Upload, Trash2, Youtube, Instagram, Facebook, Twitter, Link2, RefreshCw, Palette, Check } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { toast } from '../../components/ui/Toast';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useTheme, SIDEBAR_PRESETS, type SidebarPreset } from '../../lib/theme';
import {
  useLogo, useUploadLogo, useDeleteLogo,
  useSocialHandles, useUpdateSocialHandles,
} from '../../lib/queries';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState('profile');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? '';
  const phone = (user?.user_metadata?.phone as string | undefined) ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);

  const { data: logoData } = useLogo();
  const uploadLogo = useUploadLogo();
  const deleteLogo = useDeleteLogo();

  const { data: socialData } = useSocialHandles();
  const updateSocial = useUpdateSocialHandles();

  const [socials, setSocials] = useState({
    youtube: '',
    instagram: '',
    facebook: '',
    twitter: '',
    tiktok: '',
  });
  const [socialsLoaded, setSocialsLoaded] = useState(false);

  useEffect(() => {
    if (socialData && !socialsLoaded) {
      setSocials({
        youtube: socialData.youtube ?? '',
        instagram: socialData.instagram ?? '',
        facebook: socialData.facebook ?? '',
        twitter: socialData.twitter ?? '',
        tiktok: socialData.tiktok ?? '',
      });
      setSocialsLoaded(true);
    }
  }, [socialData, socialsLoaded]);

async function handlePasswordUpdate() {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setUpdatingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPw(false);
    if (error) {
      toast.error('Could not update password', error.message);
      return;
    }
    setNewPassword('');
    toast.success('Password updated');
  }

  function handleFileSelect() {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be under 2 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          await uploadLogo.mutateAsync(dataUrl);
          toast.success('Logo uploaded');
        } catch (e) {
          toast.error('Upload failed', e instanceof Error ? e.message : undefined);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  async function handleDeleteLogo() {
    try {
      await deleteLogo.mutateAsync();
      toast.success('Logo removed');
    } catch (e) {
      toast.error('Failed to remove logo', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleSaveSocials() {
    try {
      await updateSocial.mutateAsync({
        youtube: socials.youtube || null,
        instagram: socials.instagram || null,
        facebook: socials.facebook || null,
        twitter: socials.twitter || null,
        tiktok: socials.tiktok || null,
      });
      toast.success('Social handles saved');
    } catch (e) {
      toast.error('Failed to save', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-3xl pb-24"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: isMobile ? 20 : 32 }}
      >
        <View className="mb-5">
          <Text
            className={`font-bold text-ink ${isMobile ? 'text-[22px]' : 'text-[24px]'}`}
            style={{ letterSpacing: -0.5 }}
          >
            Settings
          </Text>
          <Text className="text-[13px] text-ink-muted mt-1">Manage your account, branding, and integrations.</Text>
        </View>

        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'profile', label: 'Profile' },
            { value: 'appearance', label: 'Appearance' },
            { value: 'branding', label: 'Branding' },
            { value: 'social', label: 'Social' },
            { value: 'account', label: 'Account' },
          ]}
          className="mb-5"
        />

        {tab === 'appearance' ? <AppearancePanel /> : null}

        {tab === 'profile' ? (
          <Card>
            <Card.Body className="gap-4">
              <Input label="Full name" value={fullName} editable={false} />
              <Input label="Email" value={user?.email ?? ''} editable={false} />
              <Input label="Phone" value={phone || '—'} editable={false} />
              <View className="rounded-lg bg-surface-raised px-3.5 py-2.5">
                <Text className="text-[12px] text-ink-muted">
                  Profile editing will arrive in a future update.
                </Text>
              </View>
            </Card.Body>
          </Card>
        ) : null}

        {tab === 'branding' ? (
          <View className="gap-4">
            <Card>
              <Card.Header>
                <Text className="text-[14px] font-semibold text-ink">Brand logo</Text>
                <Text className="text-[12px] text-ink-muted mt-0.5">
                  Your logo appears in the top-right corner of every generated video frame.
                </Text>
              </Card.Header>
              <Card.Body className="gap-4">
                {logoData?.logo_url ? (
                  <View className="flex-row items-center gap-4">
                    <View className="h-20 w-20 rounded-lg border border-surface-border items-center justify-center bg-surface-raised overflow-hidden">
                      <Image
                        source={{ uri: logoData.logo_url }}
                        style={{ width: 72, height: 72 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View className="flex-1 gap-2">
                      <Text className="text-[13px] text-ink font-semibold">Logo uploaded</Text>
                      <Text className="text-[11px] text-ink-muted">
                        Will appear on all new projects. PNG or SVG recommended.
                      </Text>
                      <View className="flex-row gap-2">
                        <Button variant="secondary" size="sm" onPress={handleFileSelect} loading={uploadLogo.isPending} leftIcon={<Upload size={12} color="#B0BEC5" />}>Replace</Button>
                        <Button variant="secondary" size="sm" onPress={handleDeleteLogo} loading={deleteLogo.isPending} leftIcon={<Trash2 size={12} color="#78909C" />}>Remove</Button>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={handleFileSelect} className="border-2 border-dashed border-surface-border rounded-xl p-6 items-center justify-center">
                    <Upload size={20} color="#78909C" />
                    <Text className="text-[13px] font-semibold text-ink mt-2">Upload your logo</Text>
                    <Text className="text-[11px] text-ink-muted mt-0.5">PNG, JPG, SVG or WebP — max 2 MB</Text>
                    {uploadLogo.isPending ? <Text className="text-[11px] text-ink-muted mt-1">Uploading...</Text> : null}
                  </Pressable>
                )}
              </Card.Body>
            </Card>
          </View>
        ) : null}

        {tab === 'social' ? (
          <Card>
            <Card.Header>
              <Text className="text-[14px] font-semibold text-ink">Social handles</Text>
              <Text className="text-[12px] text-ink-muted mt-0.5">
                These appear in your video descriptions and overlays.
              </Text>
            </Card.Header>
            <Card.Body className="gap-4">
              <Input
                label="YouTube"
                value={socials.youtube}
                onChangeText={(v) => setSocials((s) => ({ ...s, youtube: v }))}
                placeholder="@yourchannel"
                leftIcon={<Youtube size={14} color="#E53935" />}
              />
              <Input
                label="Instagram"
                value={socials.instagram}
                onChangeText={(v) => setSocials((s) => ({ ...s, instagram: v }))}
                placeholder="@yourhandle"
                leftIcon={<Instagram size={14} color="#E040FB" />}
              />
              <Input
                label="Facebook"
                value={socials.facebook}
                onChangeText={(v) => setSocials((s) => ({ ...s, facebook: v }))}
                placeholder="facebook.com/yourpage"
                leftIcon={<Facebook size={14} color="#42A5F5" />}
              />
              <Input
                label="Twitter / X"
                value={socials.twitter}
                onChangeText={(v) => setSocials((s) => ({ ...s, twitter: v }))}
                placeholder="@yourhandle"
                leftIcon={<Twitter size={14} color="#B0BEC5" />}
              />
              <Input
                label="TikTok"
                value={socials.tiktok}
                onChangeText={(v) => setSocials((s) => ({ ...s, tiktok: v }))}
                placeholder="@yourhandle"
                leftIcon={<Link2 size={14} color="#00E676" />}
              />
              <View className="flex-row">
                <Button
                  onPress={handleSaveSocials}
                  loading={updateSocial.isPending}
                >
                  Save handles
                </Button>
              </View>
              <View className="rounded-lg bg-surface-raised px-3.5 py-2.5 border border-surface-border">
                <Text className="text-[12px] text-ink-muted">
                  Social handles are included in AI-generated YouTube descriptions and hashtags when you publish.
                </Text>
              </View>
            </Card.Body>
          </Card>
        ) : null}

        {tab === 'account' ? (
          <View className="gap-4">
            <Card>
              <Card.Header>
                <Text className="text-[14px] font-semibold text-ink">Change password</Text>
                <Text className="text-[12px] text-ink-muted mt-0.5">Update your password to keep your account secure.</Text>
              </Card.Header>
              <Card.Body className="gap-4">
                <Input
                  label="New password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                />
                <View className="flex-row">
                  <Button onPress={handlePasswordUpdate} loading={updatingPw}>
                    Update password
                  </Button>
                </View>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Text className="text-[14px] font-semibold text-ink">Session</Text>
                <Text className="text-[12px] text-ink-muted mt-0.5">Sign out of your current session.</Text>
              </Card.Header>
              <Card.Body>
                <View className="flex-row">
                  <Button variant="secondary" onPress={() => signOut()} leftIcon={<LogOut size={14} color="#78909C" />}>
                    Sign out
                  </Button>
                </View>
              </Card.Body>
            </Card>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

// =====================================================================
// Appearance — sidebar theme picker
// =====================================================================
function AppearancePanel() {
  const { theme, sidebar, setSidebarPreset, setSidebarCustomColor, setAccent, resetTheme } = useTheme();
  const [customHex, setCustomHex] = useState(theme.sidebarCustomColor);
  const [accentHex, setAccentHex] = useState(theme.accent);

  function handleCustomBlur() {
    const v = customHex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setSidebarCustomColor(v);
    } else {
      setCustomHex(theme.sidebarCustomColor);
    }
  }

  function handleAccentBlur() {
    const v = accentHex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setAccent(v);
    } else {
      setAccentHex(theme.accent);
    }
  }

  return (
    <View className="gap-5">
      {/* Preview */}
      <Card>
        <Card.Header>
          <View className="flex-row items-center gap-2">
            <Palette size={14} color="#78909C" />
            <Text className="text-[14px] font-semibold text-ink">Sidebar theme</Text>
          </View>
          <Text className="text-[12px] text-ink-muted mt-0.5">
            Pick a sidebar look. Changes apply immediately and stay across sessions.
          </Text>
        </Card.Header>
        <Card.Body>
          {/* Live preview frame */}
          <View
            className="rounded-xl overflow-hidden border border-surface-border mb-4"
            style={{ height: 220 }}
          >
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <View
                style={{
                  width: 160,
                  backgroundColor: sidebar.bg,
                  borderRightWidth: sidebar.isDark ? 0 : 1,
                  borderRightColor: sidebar.border,
                  paddingHorizontal: 8,
                  paddingTop: 14,
                  gap: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: sidebar.textActive }}>Snap</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: sidebar.brand, fontStyle: 'italic' }}>
                    Viral
                  </Text>
                </View>
                {[
                  { l: 'Dashboard', active: true },
                  { l: 'New Project', active: false },
                  { l: 'Library', active: false },
                  { l: 'Settings', active: false },
                ].map((row, i) => (
                  <View
                    key={i}
                    style={{
                      position: 'relative',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 6,
                      backgroundColor: row.active ? sidebar.activeBg : 'transparent',
                    }}
                  >
                    {row.active ? (
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 6,
                          bottom: 6,
                          width: 2.5,
                          borderRadius: 2,
                          backgroundColor: sidebar.activeBar,
                        }}
                      />
                    ) : null}
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: row.active ? sidebar.activeBar : sidebar.textInactive,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        color: row.active ? sidebar.textActive : sidebar.textInactive,
                        fontWeight: row.active ? '600' : '500',
                      }}
                    >
                      {row.l}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1, backgroundColor: '#FAFAF7', padding: 14 }}>
                <Text style={{ fontSize: 11, color: '#71717A', letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' }}>
                  Live preview
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0A0A0B', marginTop: 6, letterSpacing: -0.4 }}>
                  Studio
                </Text>
                <Text style={{ fontSize: 11, color: '#52525B', marginTop: 4 }}>
                  This is what your app shell will look like.
                </Text>
              </View>
            </View>
          </View>

          {/* Preset grid */}
          <View className="flex-row flex-wrap gap-2.5">
            {SIDEBAR_PRESETS.map((p) => {
              const active = theme.sidebarPreset === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => setSidebarPreset(p.key)}
                  style={{
                    width: 84,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: active ? '#E11D2C' : 'rgba(15,23,42,0.10)',
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 36,
                      borderRadius: 6,
                      backgroundColor: p.swatch,
                      borderWidth: p.isDark ? 0 : 1,
                      borderColor: 'rgba(15,23,42,0.08)',
                      position: 'relative',
                    }}
                  >
                    {active ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: '#E11D2C',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={9} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: active ? '700' : '500',
                      color: active ? '#E11D2C' : '#27272A',
                    }}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card.Body>
      </Card>

      {/* Custom hex */}
      <Card>
        <Card.Header>
          <Text className="text-[14px] font-semibold text-ink">Custom color</Text>
          <Text className="text-[12px] text-ink-muted mt-0.5">
            Type a hex code for full control. Contrast adapts automatically.
          </Text>
        </Card.Header>
        <Card.Body>
          <View className="flex-row items-end gap-3">
            <View
              style={{
                width: 50,
                height: 38,
                borderRadius: 8,
                backgroundColor: theme.sidebarCustomColor,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.10)',
              }}
            />
            <View style={{ flex: 1 }}>
              <Text className="text-[11px] font-bold text-ink-subtle uppercase tracking-wider mb-1.5">
                Sidebar background
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                  height: 38,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(15,23,42,0.10)',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#71717A' }}>#</Text>
                <TextInput
                  value={customHex.replace(/^#/, '')}
                  onChangeText={(v) => setCustomHex('#' + v.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
                  onBlur={handleCustomBlur}
                  placeholder="0F1B2D"
                  placeholderTextColor="#A1A1AA"
                  autoCapitalize="characters"
                  style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: '#0A0A0B',
                    ...({ outlineStyle: 'none' } as any),
                  }}
                />
                <Pressable
                  onPress={handleCustomBlur}
                  style={{
                    paddingHorizontal: 10,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: '#0A0A0B',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700' }}>Apply</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="flex-row items-end gap-3 mt-4">
            <View
              style={{
                width: 50,
                height: 38,
                borderRadius: 8,
                backgroundColor: theme.accent,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.10)',
              }}
            />
            <View style={{ flex: 1 }}>
              <Text className="text-[11px] font-bold text-ink-subtle uppercase tracking-wider mb-1.5">
                Brand accent
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                  height: 38,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(15,23,42,0.10)',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#71717A' }}>#</Text>
                <TextInput
                  value={accentHex.replace(/^#/, '')}
                  onChangeText={(v) => setAccentHex('#' + v.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
                  onBlur={handleAccentBlur}
                  placeholder="E11D2C"
                  placeholderTextColor="#A1A1AA"
                  autoCapitalize="characters"
                  style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: '#0A0A0B',
                    ...({ outlineStyle: 'none' } as any),
                  }}
                />
                <Pressable
                  onPress={handleAccentBlur}
                  style={{
                    paddingHorizontal: 10,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: '#0A0A0B',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700' }}>Apply</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="mt-5 pt-4 border-t border-surface-border flex-row items-center justify-between">
            <Text className="text-[12px] text-ink-muted">
              Stored on this device. Doesn't sync between browsers yet.
            </Text>
            <Pressable
              onPress={() => {
                resetTheme();
                setCustomHex('#0F1B2D');
                setAccentHex('#E11D2C');
                toast.success('Theme reset to default');
              }}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-md border border-surface-border"
            >
              <RefreshCw size={11} color="#52525B" />
              <Text className="text-[11px] font-semibold text-ink-secondary">Reset</Text>
            </Pressable>
          </View>
        </Card.Body>
      </Card>
    </View>
  );
}
