import { MotiView } from 'moti';
import { View } from 'react-native';

interface SkeletonProps {
  className?: string;
  style?: any;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <MotiView
      className={`bg-surface-raised rounded-md ${className}`}
      from={{ opacity: 0.4 }}
      animate={{ opacity: 0.8 }}
      transition={{
        type: 'timing',
        duration: 900,
        loop: true,
        repeatReverse: true,
      }}
      style={style}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <View className={`gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </View>
  );
}
