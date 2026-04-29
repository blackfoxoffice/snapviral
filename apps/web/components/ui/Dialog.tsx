import { Modal, Pressable, View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { X } from 'lucide-react-native';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-lg rounded-xl border border-surface-border bg-surface-card shadow-lg"
          onPress={(e) => e.stopPropagation?.()}
        >
          {title ? (
            <View className="flex-row items-start justify-between px-5 pt-4 pb-3 border-b border-surface-border">
              <View className="flex-1 pr-4">
                <Text className="text-[15px] font-semibold text-ink">{title}</Text>
                {description ? (
                  <Text className="mt-1 text-[13px] text-ink-muted">{description}</Text>
                ) : null}
              </View>
              <Pressable onPress={onClose} className="p-1">
                <X size={16} color="#78909C" />
              </Pressable>
            </View>
          ) : null}
          <View className="px-5 py-4">{children}</View>
          {footer ? (
            <View className="flex-row justify-end gap-2 px-5 py-3 border-t border-surface-border">
              {footer}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
