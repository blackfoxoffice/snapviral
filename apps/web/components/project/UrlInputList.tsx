import { View, Text, Pressable, Image, useWindowDimensions } from 'react-native';
import { Plus, Trash2, Youtube } from 'lucide-react-native';
import { Input } from '../ui/Input';
import { youtubeUrlRegex } from '@newsflow/shared';

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
  error?: string;
}

function extractYouTubeId(url: string): string | null {
  if (!youtubeUrlRegex.test(url)) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] ?? null;
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] ?? null;
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

export function UrlInputList({ urls, onChange, error }: Props) {
  const { width } = useWindowDimensions();
  const showThumbs = width >= 600;

  const updateAt = (i: number, v: string) => {
    const next = [...urls];
    next[i] = v;
    onChange(next);
  };

  const removeAt = (i: number) => {
    if (urls.length <= 1) return;
    onChange(urls.filter((_, idx) => idx !== i));
  };

  const add = () => {
    if (urls.length >= 5) return;
    onChange([...urls, '']);
  };

  return (
    <View className="gap-2.5">
      {urls.map((url, i) => {
        const id = extractYouTubeId(url);
        const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
        return (
          <View key={i} className="flex-row items-center gap-2">
            {showThumbs ? (
              <View className="h-[54px] w-[96px] overflow-hidden rounded-lg bg-surface-raised items-center justify-center">
                {thumb ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image source={{ uri: thumb }} style={{ width: 96, height: 54 }} />
                ) : (
                  <Youtube size={16} color="#546E7A" />
                )}
              </View>
            ) : null}
            <View className="flex-1">
              <Input
                value={url}
                onChangeText={(v) => updateAt(i, v)}
                placeholder={showThumbs ? 'https://www.youtube.com/watch?v=...' : 'YouTube URL...'}
                autoCapitalize="none"
              />
            </View>
            <Pressable
              onPress={() => removeAt(i)}
              disabled={urls.length <= 1}
              className={`h-10 w-10 items-center justify-center rounded-lg border border-surface-border bg-surface-raised ${
                urls.length <= 1 ? 'opacity-30' : 'hover:bg-surface-card'
              }`}
            >
              <Trash2 size={14} color="#78909C" />
            </Pressable>
          </View>
        );
      })}
      {error ? <Text className="text-[11px] text-state-error">{error}</Text> : null}
      <Pressable
        onPress={add}
        disabled={urls.length >= 5}
        className={`flex-row items-center justify-center gap-1.5 rounded-lg border border-dashed border-surface-border py-2.5 ${
          urls.length >= 5 ? 'opacity-40' : 'hover:bg-surface-raised'
        }`}
      >
        <Plus size={14} color="#78909C" />
        <Text className="text-[12px] font-semibold text-ink-muted">
          {urls.length >= 5 ? 'Maximum 5 URLs' : 'Add another URL'}
        </Text>
      </Pressable>
    </View>
  );
}
