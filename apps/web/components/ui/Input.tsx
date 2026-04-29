import { forwardRef, type ReactNode } from 'react';
import { TextInput, View, Text, type TextInputProps, type TextInput as TextInputType } from 'react-native';

export interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  helper?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  inputClassName?: string;
}

export const Input = forwardRef<TextInputType, InputProps>(function Input(props, ref) {
  const { label, helper, error, leftIcon, rightIcon, className = '', inputClassName = '', ...rest } = props;
  const border = error ? 'border-state-error' : 'border-surface-border focus:border-ink-subtle';

  return (
    <View className={className}>
      {label ? <Text className="text-[12px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">{label}</Text> : null}
      <View className={`flex-row items-center rounded-lg border bg-surface-raised px-3 h-10 ${border}`}>
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#546E7A"
          className={`flex-1 text-[13px] text-ink outline-none ${inputClassName}`}
          {...rest}
        />
        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text className="text-[11px] text-state-error mt-1">{error}</Text>
      ) : helper ? (
        <Text className="text-[11px] text-ink-muted mt-1">{helper}</Text>
      ) : null}
    </View>
  );
});
