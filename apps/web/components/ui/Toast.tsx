import { create } from 'zustand';
import { View, Text, Pressable } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react-native';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastStore {
  items: ToastItem[];
  push: (item: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const store = create<ToastStore>((set) => ({
  items: [],
  push(item) {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ items: [...s.items, { ...item, id }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, 4500);
  },
  dismiss(id) {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (title: string, description?: string) =>
    store.getState().push({ kind: 'success', title, description }),
  error: (title: string, description?: string) =>
    store.getState().push({ kind: 'error', title, description }),
  info: (title: string, description?: string) =>
    store.getState().push({ kind: 'info', title, description }),
  warning: (title: string, description?: string) =>
    store.getState().push({ kind: 'warning', title, description }),
};

const KIND_ICON: Record<ToastKind, { icon: React.ReactNode }> = {
  success: { icon: <CheckCircle2 size={16} color="#00E676" /> },
  error: { icon: <XCircle size={16} color="#EF4444" /> },
  info: { icon: <Info size={16} color="#42A5F5" /> },
  warning: { icon: <AlertCircle size={16} color="#FFB300" /> },
};

export function ToastHost() {
  const items = store((s) => s.items);
  const dismiss = store((s) => s.dismiss);

  return (
    <View
      pointerEvents="box-none"
      className="absolute right-4 z-50 gap-2"
      style={{
        maxWidth: 340,
        // Sit below the 48px TopBar AND below any device status bar/notch
        // so the toast doesn't overlap the page header in the APK/PWA.
        top: 'calc(env(safe-area-inset-top, 0px) + 56px)' as any,
      }}
    >
      <AnimatePresence>
        {items.map((t) => {
          const k = KIND_ICON[t.kind];
          return (
            <MotiView
              key={t.id}
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -8 }}
              transition={{ type: 'timing', duration: 180 }}
              className="flex-row items-start gap-2.5 rounded-xl border border-surface-border bg-surface-card px-3.5 py-2.5 shadow-md"
              style={{ minWidth: 260 }}
            >
              <View className="pt-px">{k.icon}</View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-ink">{t.title}</Text>
                {t.description ? (
                  <Text className="mt-0.5 text-[12px] text-ink-muted">{t.description}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => dismiss(t.id)} className="p-0.5">
                <X size={14} color="#78909C" />
              </Pressable>
            </MotiView>
          );
        })}
      </AnimatePresence>
    </View>
  );
}
