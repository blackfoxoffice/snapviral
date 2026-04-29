import { View, Text, Pressable } from 'react-native';
import { Check, Palette, Brush, Camera, Sparkles } from 'lucide-react-native';
import type { ImageStyle } from '@newsflow/shared';
import type { LucideIcon } from 'lucide-react-native';

interface StyleOption {
  value: ImageStyle;
  label: string;
  description: string;
  Icon: LucideIcon;
}

const STYLES: StyleOption[] = [
  {
    value: 'cartoon',
    label: 'Cartoon',
    description: 'Bold outlines, flat colors, comic-style illustrations',
    Icon: Palette,
  },
  {
    value: 'illustrated',
    label: 'Digital Art',
    description: 'Semi-realistic editorial illustrations, clean lines',
    Icon: Brush,
  },
  {
    value: 'realistic',
    label: 'Realistic',
    description: 'Photorealistic documentary-style imagery',
    Icon: Camera,
  },
  {
    value: 'ultra_realistic',
    label: 'Ultra HD',
    description: 'Hyper-detailed 4K photography, cinematic lighting',
    Icon: Sparkles,
  },
];

interface StylePickerProps {
  value: ImageStyle;
  onChange: (style: ImageStyle) => void;
}

export function StylePicker({ value, onChange }: StylePickerProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-semibold text-ink-secondary mb-1 uppercase tracking-wide">
        Image style
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {STYLES.map((style) => {
          const selected = value === style.value;
          const Icon = style.Icon;
          return (
            <Pressable
              key={style.value}
              onPress={() => onChange(style.value)}
              className={`flex-1 rounded-lg border p-3 ${
                selected ? 'border-accent-border bg-accent-soft' : 'border-surface-border bg-surface-raised'
              }`}
              style={{ minWidth: 140, flexBasis: '45%' }}
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <Icon size={16} color={selected ? '#00E676' : '#78909C'} strokeWidth={selected ? 2 : 1.5} />
                {selected ? (
                  <View className="h-4 w-4 items-center justify-center rounded-full bg-accent">
                    <Check size={8} color="#0A0A0A" strokeWidth={3} />
                  </View>
                ) : null}
              </View>
              <Text className={`text-[13px] font-semibold ${selected ? 'text-accent' : 'text-ink-secondary'}`}>
                {style.label}
              </Text>
              <Text className="text-[11px] text-ink-muted mt-0.5" numberOfLines={2}>
                {style.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
