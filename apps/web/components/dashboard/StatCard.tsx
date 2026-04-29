import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper?: string;
}

export function StatCard({ icon, label, value, helper }: StatCardProps) {
  return (
    <View
      className="rounded-xl border border-surface-border bg-surface-card p-4"
      style={{ flexBasis: '47%', flexGrow: 1, minWidth: 140 }}
    >
      <View className="flex-row items-center justify-between mb-2.5">
        {icon}
        <Text className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
          {label}
        </Text>
      </View>
      <Text
        className="text-[26px] font-bold text-ink"
        style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}
      >
        {value}
      </Text>
      {helper ? <Text className="mt-0.5 text-[11px] text-ink-muted">{helper}</Text> : null}
    </View>
  );
}
