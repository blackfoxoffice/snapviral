import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

type Variant = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'brand';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const STYLES: Record<Variant, { bg: string; text: string; border: string }> = {
  neutral: { bg: 'bg-surface-raised', text: 'text-ink-muted', border: 'border-surface-border' },
  success: { bg: 'bg-state-success-soft', text: 'text-accent', border: 'border-accent-border' },
  warning: { bg: 'bg-state-warning-soft', text: 'text-state-warning', border: 'border-state-warning/25' },
  error: { bg: 'bg-state-error-soft', text: 'text-state-error', border: 'border-state-error/25' },
  info: { bg: 'bg-state-info-soft', text: 'text-state-info', border: 'border-state-info/25' },
  brand: { bg: 'bg-brand-soft', text: 'text-brand', border: 'border-brand/25' },
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const s = STYLES[variant];
  return (
    <View className={`self-start rounded-md border px-2.5 py-0.5 ${s.bg} ${s.border} ${className}`}>
      <Text className={`text-[11px] font-semibold ${s.text}`}>{children}</Text>
    </View>
  );
}
