import { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type TextInput as TextInputType,
} from 'react-native';

export interface TextareaProps extends Omit<TextInputProps, 'className' | 'multiline'> {
  label?: string;
  helper?: string;
  error?: string;
  rows?: number;
  className?: string;
}

export const Textarea = forwardRef<TextInputType, TextareaProps>(function Textarea(props, ref) {
  const { label, helper, error, rows = 6, className = '', style, ...rest } = props;
  const border = error ? 'border-state-error' : 'border-surface-border focus:border-ink-subtle';

  return (
    <View className={className}>
      {label ? (
        <Text className="text-[12px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">{label}</Text>
      ) : null}
      <View className={`rounded-lg border bg-surface-raised px-3 py-2.5 ${border}`}>
        <TextInput
          ref={ref}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#546E7A"
          style={[{ minHeight: rows * 20 }, style]}
          className="text-[13px] text-ink outline-none leading-relaxed"
          {...rest}
        />
      </View>
      {error ? (
        <Text className="text-[11px] text-state-error mt-1">{error}</Text>
      ) : helper ? (
        <Text className="text-[11px] text-ink-muted mt-1">{helper}</Text>
      ) : null}
    </View>
  );
});
