import { Pressable, View, Text } from 'react-native';
import type { ReactNode } from 'react';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  helper?: string;
}

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  items: TabItem[];
  variant?: 'line' | 'card';
  className?: string;
}

export function Tabs({ value, onChange, items, variant = 'line', className = '' }: TabsProps) {
  if (variant === 'card') {
    return (
      <View className={`flex-row flex-wrap gap-2 ${className}`}>
        {items.map((item) => {
          const active = item.value === value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              style={{ flexBasis: '48%', flexGrow: 1, minWidth: 140 }}
              className={`rounded-lg border px-3 py-2.5 ${
                active
                  ? 'border-accent-border bg-accent-soft'
                  : 'border-surface-border bg-surface-raised hover:bg-surface-card'
              }`}
            >
              <View className="flex-row items-center gap-1.5">
                {item.icon ? <View>{item.icon}</View> : null}
                <Text
                  className={`text-[13px] font-semibold ${active ? 'text-accent' : 'text-ink-secondary'}`}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
              {item.helper ? (
                <Text className="mt-0.5 text-[11px] text-ink-muted" numberOfLines={1}>{item.helper}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View className={`flex-row border-b border-surface-border ${className}`}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            className={`px-4 py-2.5 ${active ? 'border-b-2 border-brand' : ''}`}
          >
            <Text
              className={`text-[13px] font-semibold ${active ? 'text-ink' : 'text-ink-muted'}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
