import { useState } from 'react';
import { Pressable, View, Text, Modal, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
  helper?: string;
}

interface SelectProps<T extends string = string> {
  label?: string;
  helper?: string;
  error?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
}

export function Select<T extends string = string>(props: SelectProps<T>) {
  const { label, helper, error, value, options, onChange, placeholder = 'Select...', className = '' } = props;
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const border = error ? 'border-state-error' : 'border-surface-border';

  return (
    <View className={className}>
      {label ? <Text className="text-[12px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        className={`h-10 flex-row items-center justify-between rounded-lg border bg-surface-raised px-3 ${border}`}
      >
        <Text className={`text-[13px] ${current ? 'text-ink' : 'text-ink-subtle'}`}>
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown size={14} color="#78909C" />
      </Pressable>
      {error ? (
        <Text className="text-[11px] text-state-error mt-1">{error}</Text>
      ) : helper ? (
        <Text className="text-[11px] text-ink-muted mt-1">{helper}</Text>
      ) : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 p-4"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="w-full max-w-md rounded-xl border border-surface-border bg-surface-card shadow-lg"
            onPress={(e) => e.stopPropagation?.()}
          >
            <View className="px-4 py-3 border-b border-surface-border">
              <Text className="text-[14px] font-semibold text-ink">{label ?? 'Select'}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    disabled={item.disabled}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      item.disabled ? 'opacity-40' : 'hover:bg-surface-raised'
                    } ${selected ? 'bg-surface-raised' : ''}`}
                  >
                    <View className="flex-1">
                      <Text className="text-[13px] text-ink">{item.label}</Text>
                      {item.helper ? (
                        <Text className="text-[11px] text-ink-muted mt-0.5">{item.helper}</Text>
                      ) : null}
                    </View>
                    {selected ? <Check size={14} color="#00E676" /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
