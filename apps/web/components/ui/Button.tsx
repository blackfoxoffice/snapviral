import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  block?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const V: Record<Variant, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-brand', text: 'text-white', border: 'border border-brand hover:bg-brand-hover' },
  secondary: { bg: 'bg-surface-raised', text: 'text-ink', border: 'border border-surface-border hover:bg-surface-card' },
  ghost: { bg: 'bg-transparent', text: 'text-ink-secondary', border: 'border border-transparent hover:bg-surface-raised' },
  danger: { bg: 'bg-state-error', text: 'text-white', border: 'border border-state-error hover:opacity-90' },
};

const S: Record<Size, string> = {
  sm: 'px-3 h-8 text-[12px] gap-1.5 rounded-md',
  md: 'px-4 h-9 text-[13px] gap-1.5 rounded-lg',
  lg: 'px-5 h-10 text-[14px] gap-2 rounded-lg',
};

export const Button = forwardRef<View, ButtonProps>(function Button(props, ref) {
  const {
    children, variant = 'primary', size = 'md', leftIcon, rightIcon,
    loading, block, disabled, className = '', style, ...rest
  } = props;

  const v = V[variant];

  return (
    <Pressable
      ref={ref}
      disabled={disabled || loading}
      {...rest}
      style={style}
      className={`flex-row items-center justify-center ${S[size]} ${v.bg} ${v.border} ${
        disabled || loading ? 'opacity-40' : ''
      } ${block ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : '#F5F5F5'} />
      ) : leftIcon ? (
        <View>{leftIcon}</View>
      ) : null}
      <Text className={`${v.text} font-semibold`} style={{ letterSpacing: 0.2 }}>{children}</Text>
      {rightIcon && !loading ? <View>{rightIcon}</View> : null}
    </Pressable>
  );
});
