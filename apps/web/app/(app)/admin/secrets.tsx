import { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { KeyRound, Plus, RefreshCw, Trash2, EyeOff, AlertTriangle } from 'lucide-react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Dialog } from '../../../components/ui/Dialog';
import { toast } from '../../../components/ui/Toast';
import { maskSecret } from '../../../lib/admin';
import {
  useAdminSecrets,
  useCreateAdminSecret,
  useDeleteAdminSecret,
  useRotateAdminSecret,
} from '../../../lib/queries';
import type { AdminSecret } from '@newsflow/shared';

const KNOWN_KEYS = [
  'OPENROUTER_API_KEY',
  'ELEVENLABS_API_KEY',
  'GOOGLE_CLIENT_SECRET',
  'YOUTUBE_API_KEY',
];

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AdminSecrets() {
  const { data: secrets, isLoading } = useAdminSecrets();
  const createMut = useCreateAdminSecret();
  const rotateMut = useRotateAdminSecret();
  const deleteMut = useDeleteAdminSecret();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [createOpen, setCreateOpen] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<AdminSecret | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSecret | null>(null);

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-[1100px]"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: 24, paddingBottom: 80 }}
      >
        <View className={`mb-6 ${isMobile ? 'gap-3' : 'flex-row items-end justify-between'}`}>
          <View>
            <Text className="text-[24px] font-bold text-ink mb-1" style={{ letterSpacing: -0.5 }}>
              API secrets
            </Text>
            <Text className="text-[13px] text-ink-muted max-w-[600px]">
              Encrypted at rest with libsodium / AES-256 via Supabase Vault. Plaintext is decrypted only by the API server. Even admins can never view it after creation.
            </Text>
          </View>
          <Button leftIcon={<Plus size={14} color="#fff" />} onPress={() => setCreateOpen(true)} block={isMobile}>
            New secret
          </Button>
        </View>

        <View
          className="flex-row items-start gap-2 rounded-xl px-4 py-3 mb-5"
          style={{ backgroundColor: 'rgba(66,165,245,0.06)', borderWidth: 1, borderColor: 'rgba(66,165,245,0.15)' }}
        >
          <EyeOff size={14} color="#42A5F5" />
          <Text className="flex-1 text-[12px] text-state-info leading-relaxed">
            Values are write-once: once saved, the cleartext is not retrievable from this UI, the database dump, or the API logs. To replace a value, use Rotate.
          </Text>
        </View>

        <Card variant="flat">
          <Card.Header>
            <Text className="text-[13px] font-semibold text-ink">Stored keys</Text>
          </Card.Header>
          {isLoading ? (
            <View className="p-4 gap-3">
              <Skeleton className="h-12 rounded-md" />
              <Skeleton className="h-12 rounded-md" />
              <Skeleton className="h-12 rounded-md" />
            </View>
          ) : !secrets || secrets.length === 0 ? (
            <View className="p-8 items-center">
              <View
                className="items-center justify-center rounded-xl mb-3"
                style={{ width: 48, height: 48, backgroundColor: 'rgba(229,57,53,0.08)' }}
              >
                <KeyRound size={20} color="#E53935" />
              </View>
              <Text className="text-[14px] font-semibold text-ink mb-1">No secrets yet</Text>
              <Text className="text-[12px] text-ink-muted text-center max-w-[320px] mb-4">
                Add your API keys below. They'll be encrypted in the vault before they touch disk.
              </Text>
              <Button onPress={() => setCreateOpen(true)} leftIcon={<Plus size={14} color="#fff" />}>
                Add first key
              </Button>
            </View>
          ) : (
            <View>
              {secrets.map((s, i) => (
                <View
                  key={s.key_name}
                  className="flex-row items-center px-5 py-3.5"
                  style={i < secrets.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#2A2A2A' } : {}}
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[13px] font-mono font-semibold text-ink">
                        {s.key_name}
                      </Text>
                      {s.rotated_at ? (
                        <View className="rounded bg-state-success-soft px-1.5 py-0.5">
                          <Text className="text-[9px] font-bold text-accent uppercase">rotated</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-[11px] text-ink-subtle font-mono mt-0.5">
                      {maskSecret(s.last4)}
                    </Text>
                    <Text className="text-[10px] text-ink-muted mt-0.5">
                      Added {timeAgo(s.created_at)}
                      {s.rotated_at ? ` · Last rotated ${timeAgo(s.rotated_at)}` : null}
                      {s.description ? ` · ${s.description}` : null}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setRotateTarget(s)}
                    className="px-3 py-2 rounded-md hover:bg-surface-raised"
                  >
                    <View className="flex-row items-center gap-1.5">
                      <RefreshCw size={12} color="#78909C" />
                      <Text className="text-[12px] text-ink-secondary">Rotate</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => setDeleteTarget(s)}
                    className="px-3 py-2 rounded-md hover:bg-state-error-soft"
                  >
                    <Trash2 size={12} color="#EF5350" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>

      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (args) => {
          try {
            await createMut.mutateAsync(args);
            toast.success('Secret added', `${args.key_name} stored in vault`);
            setCreateOpen(false);
          } catch (e) {
            toast.error('Failed to add secret', e instanceof Error ? e.message : undefined);
          }
        }}
        loading={createMut.isPending}
      />

      <RotateDialog
        target={rotateTarget}
        onClose={() => setRotateTarget(null)}
        onRotate={async (key_name, value) => {
          try {
            await rotateMut.mutateAsync({ key_name, value });
            toast.success('Secret rotated', `${key_name} updated`);
            setRotateTarget(null);
          } catch (e) {
            toast.error('Rotate failed', e instanceof Error ? e.message : undefined);
          }
        }}
        loading={rotateMut.isPending}
      />

      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={async (key_name) => {
          try {
            await deleteMut.mutateAsync(key_name);
            toast.success('Secret deleted', key_name);
            setDeleteTarget(null);
          } catch (e) {
            toast.error('Delete failed', e instanceof Error ? e.message : undefined);
          }
        }}
        loading={deleteMut.isPending}
      />
    </ScrollView>
  );
}

function CreateDialog({
  open,
  onClose,
  onCreate,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (args: { key_name: string; value: string; description?: string }) => void;
  loading: boolean;
}) {
  const [keyName, setKeyName] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Dialog open={open} onClose={onClose} title="Add secret">
      <View className="gap-3">
        <View>
          <Text className="text-[11px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">
            Key name
          </Text>
          <Input
            value={keyName}
            onChangeText={setKeyName}
            placeholder="OPENROUTER_API_KEY"
            autoCapitalize="characters"
          />
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {KNOWN_KEYS.map((k) => (
              <Pressable
                key={k}
                onPress={() => setKeyName(k)}
                className="rounded bg-surface-raised border border-surface-border px-2 py-1"
              >
                <Text className="text-[10px] font-mono text-ink-secondary">{k}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Input
          label="Secret value"
          value={value}
          onChangeText={setValue}
          placeholder="paste the API key — it will be encrypted immediately"
          secureTextEntry
        />
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="What is this key used for?"
        />
        <View className="flex-row justify-end gap-2 mt-2">
          <Button variant="secondary" onPress={onClose}>Cancel</Button>
          <Button
            onPress={() => onCreate({ key_name: keyName.trim(), value, description: description.trim() || undefined })}
            disabled={!keyName.trim() || value.length < 4}
            loading={loading}
          >
            Save to vault
          </Button>
        </View>
      </View>
    </Dialog>
  );
}

function RotateDialog({
  target,
  onClose,
  onRotate,
  loading,
}: {
  target: AdminSecret | null;
  onClose: () => void;
  onRotate: (key_name: string, value: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState('');

  if (!target) return null;
  return (
    <Dialog open={!!target} onClose={onClose} title={`Rotate ${target.key_name}`}>
      <View className="gap-3">
        <View
          className="flex-row items-start gap-2 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: 'rgba(255,179,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.2)' }}
        >
          <AlertTriangle size={13} color="#FFB300" />
          <Text className="flex-1 text-[11px] text-state-warning leading-relaxed">
            The new value replaces the old one immediately. The API server cache will refresh within 5 minutes.
          </Text>
        </View>
        <Input
          label="New value"
          value={value}
          onChangeText={setValue}
          placeholder="paste new key"
          secureTextEntry
        />
        <View className="flex-row justify-end gap-2 mt-2">
          <Button variant="secondary" onPress={onClose}>Cancel</Button>
          <Button onPress={() => onRotate(target.key_name, value)} disabled={value.length < 4} loading={loading}>
            Rotate
          </Button>
        </View>
      </View>
    </Dialog>
  );
}

function DeleteDialog({
  target,
  onClose,
  onDelete,
  loading,
}: {
  target: AdminSecret | null;
  onClose: () => void;
  onDelete: (key_name: string) => void;
  loading: boolean;
}) {
  if (!target) return null;
  return (
    <Dialog open={!!target} onClose={onClose} title={`Delete ${target.key_name}?`}>
      <View className="gap-3">
        <Text className="text-[13px] text-ink-secondary leading-relaxed">
          This permanently removes the secret from the vault. Any API endpoint that depended on it will start failing immediately. This cannot be undone.
        </Text>
        <View className="flex-row justify-end gap-2 mt-2">
          <Button variant="secondary" onPress={onClose}>Cancel</Button>
          <Button onPress={() => onDelete(target.key_name)} loading={loading}>
            Delete
          </Button>
        </View>
      </View>
    </Dialog>
  );
}
