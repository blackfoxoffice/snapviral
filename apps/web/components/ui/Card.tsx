import { View, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';

interface CardProps extends ViewProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'flat';
}

export function Card({ children, className = '', variant = 'default', ...rest }: CardProps) {
  const base = 'bg-surface-card border border-surface-border rounded-xl overflow-hidden';
  return (
    <View className={`${base} ${className}`} {...rest}>
      {children}
    </View>
  );
}

Card.Header = function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`px-5 py-3.5 border-b border-surface-border ${className}`}>{children}</View>;
};

Card.Body = function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`px-5 py-4 ${className}`}>{children}</View>;
};

Card.Footer = function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`px-5 py-3 border-t border-surface-border bg-surface-raised ${className}`}>{children}</View>;
};
