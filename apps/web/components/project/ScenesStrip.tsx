import { View, Text, ScrollView, Image } from 'react-native';
import type { Asset, ScriptOutput } from '@newsflow/shared';
import { supabase } from '../../lib/supabase';
import { useEffect, useMemo, useState } from 'react';

interface Props {
  assets: Asset[];
  script: ScriptOutput | null;
}

export function ScenesStrip({ assets, script }: Props) {
  const imageAssets = useMemo(
    () =>
      assets
        .filter((a) => a.type === 'image' && a.storage_path)
        .sort((a, b) => (a.scene_index ?? 0) - (b.scene_index ?? 0)),
    [assets],
  );

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const entries = await Promise.all(
        imageAssets.map(async (a) => {
          if (!a.storage_path) return [a.id, ''] as const;
          const { data } = await supabase.storage
            .from('project-assets')
            .createSignedUrl(a.storage_path, 60 * 30);
          return [a.id, data?.signedUrl ?? ''] as const;
        }),
      );
      if (cancelled) return;
      setSignedUrls(Object.fromEntries(entries));
    }
    if (imageAssets.length > 0) load();
    return () => {
      cancelled = true;
    };
  }, [imageAssets]);

  if (imageAssets.length === 0) return null;

  return (
    <View>
      <Text className="text-[13px] font-semibold text-ink mb-2.5">Scenes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
        <View className="flex-row gap-2.5 px-1">
          {imageAssets.map((a, i) => {
            const url = signedUrls[a.id];
            const scene = script?.scenes[a.scene_index ?? i];
            return (
              <View
                key={a.id}
                className="w-[150px] overflow-hidden rounded-lg border border-surface-border bg-surface-card"
              >
                <View className="h-[225px] bg-surface-raised items-center justify-center">
                  {url ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image source={{ uri: url }} style={{ width: 150, height: 225 }} />
                  ) : null}
                </View>
                <View className="p-2">
                  <Text className="text-[10px] font-bold text-ink-muted mb-0.5 uppercase tracking-wide">
                    Scene {(a.scene_index ?? i) + 1}
                  </Text>
                  {scene ? (
                    <Text className="text-[11px] text-ink-secondary" numberOfLines={3}>
                      {scene.narration}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
