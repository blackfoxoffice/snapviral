import { View, Text, ScrollView, Pressable, useWindowDimensions, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { LogOut, Upload, Trash2, Youtube, Instagram, Facebook, Twitter, Link2 } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { toast } from '../../components/ui/Toast';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
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
            { value: 'branding', label: 'Branding' },
            { value: 'social', label: 'Social' },
            { value: 'account', label: 'Account' },
          ]}
          className="mb-5"
        />

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
