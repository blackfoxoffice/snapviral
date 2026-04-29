import { View, Text, Pressable } from 'react-native';

const DURATIONS = [10, 20, 30, 45, 60];

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function DurationPicker({ value, onChange }: Props) {
  return (
    <View>
      <Text className="text-[12px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">Duration</Text>
      <View className="flex-row flex-wrap gap-2">
        {DURATIONS.map((d) => {
          const active = d === value;
          return (
            <Pressable
              key={d}
              onPress={() => onChange(d)}
              className={`min-w-[64px] items-center justify-center rounded-lg border px-3 py-2.5 ${
                active
                  ? 'border-accent-border bg-accent-soft'
                  : 'border-surface-border bg-surface-raised hover:bg-surface-card'
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${active ? 'text-accent' : 'text-ink-secondary'}`}
              >
                {d}s
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
