import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  size?: number;
}

export function NewsflowLogo({ size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="32" y2="32">
          <Stop offset="0" stopColor="#FF1744" />
          <Stop offset="1" stopColor="#D50000" />
        </LinearGradient>
      </Defs>
      <Rect width="32" height="32" rx="8" fill="url(#bg)" />
      {/* Play triangle */}
      <Path
        d="M13 10.5V21.5L22 16L13 10.5Z"
        fill="white"
        fillOpacity={0.95}
      />
      {/* Signal wave top-right */}
      <Path
        d="M22.5 9.5C24.5 11 25.5 13.5 25.5 16"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity={0.6}
      />
      <Path
        d="M20.5 11C21.8 12 22.5 13.8 22.5 16"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity={0.4}
      />
    </Svg>
  );
}
