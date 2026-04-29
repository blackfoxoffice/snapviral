import { View, Text } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const COLORS = ['#525252', '#6B7280', '#4B5563', '#374151', '#57534E'];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

export function Avatar({ name, size = 32, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const bg = COLORS[hash(name) % COLORS.length];

  return (
    <View
      className={`items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: bg }}
    >
      <Text
        className="font-medium"
        style={{ fontSize: Math.round(size * 0.38), color: '#fff' }}
      >
        {initials || '?'}
      </Text>
    </View>
  );
}
