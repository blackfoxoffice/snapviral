import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, subtitle, action, className = '' }: EmptyStateProps) {
  return (
    <View
      className={`items-center justify-center rounded-xl border border-dashed border-surface-border py-14 px-8 ${className}`}
    >
      {icon ? <View className="mb-4">{icon}</View> : null}
      <Text className="text-[15px] font-semibold text-ink text-center">{title}</Text>
      {subtitle ? (
        <Text className="mt-1.5 max-w-xs text-center text-[13px] text-ink-muted leading-relaxed">
          {subtitle}
        </Text>
      ) : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}
