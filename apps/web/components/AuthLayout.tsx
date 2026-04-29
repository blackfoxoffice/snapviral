import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';
import { NewsflowLogo } from './icons/NewsflowLogo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthSplitLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMobile = width < 600;

  return (
    <View className="flex-1 flex-row bg-surface">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: isMobile ? 20 : 24,
        }}
        className="flex-1"
      >
        <View className="mx-auto w-full" style={{ maxWidth: isMobile ? undefined : 380 }}>
          <View className="mb-8 flex-row items-center gap-2.5">
            <NewsflowLogo size={32} />
            <Text className="text-[16px] font-bold text-ink tracking-tight">
              Newsflow
            </Text>
          </View>
          <Text
            className={`font-bold text-ink tracking-tight mb-1.5 ${isMobile ? 'text-[24px]' : 'text-[28px]'}`}
            style={{ letterSpacing: -0.5 }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[14px] text-ink-muted mb-7">{subtitle}</Text>
          ) : (
            <View className="h-7" />
          )}
          {children}
          {footer ? <View className="mt-6">{footer}</View> : null}
        </View>
      </ScrollView>

      {isWide ? (
        <View className="w-[45%] bg-surface-sunken items-center justify-center p-14">
          <View className="max-w-sm">
            <Text className="text-ink text-[28px] font-bold leading-snug tracking-tight mb-4">
              Turn any source into a finished news Short.
            </Text>
            <Text className="text-ink-muted text-[14px] leading-relaxed">
              Paste YouTube URLs, your own script, or just a topic. We write the script,
              generate visuals, add narration, and deliver a 9:16 video ready to upload.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
