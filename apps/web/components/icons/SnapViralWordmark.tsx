import { View, Text } from 'react-native';
import { SnapViralLogo } from './SnapViralLogo';

interface Props {
  /** Total height of the lockup. The icon, text size, and gap scale together. */
  size?: number;
  /** Show 'AI Video Generation' tagline below the wordmark */
  withTagline?: boolean;
  /** Use white text (for dark surfaces) — default is dark text */
  inverted?: boolean;
}

export function SnapViralWordmark({ size = 28, withTagline = false, inverted = false }: Props) {
  const wordSize = Math.round(size * 0.62);
  const tagSize = Math.max(9, Math.round(size * 0.32));
  const gap = Math.round(size * 0.32);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      <SnapViralLogo size={size} />
      <View style={{ flexDirection: 'column' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text
            style={{
              fontSize: wordSize,
              fontWeight: '800',
              letterSpacing: -0.6,
              color: inverted ? '#FFFFFF' : '#0F172A',
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: wordSize * 1.05,
            }}
          >
            Snap
          </Text>
          <Text
            style={{
              fontSize: wordSize,
              fontWeight: '800',
              letterSpacing: -0.6,
              color: '#E53935',
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: wordSize * 1.05,
              fontStyle: 'italic',
            }}
          >
            Viral
          </Text>
        </View>
        {withTagline ? (
          <Text
            style={{
              fontSize: tagSize,
              fontWeight: '500',
              color: inverted ? 'rgba(255,255,255,0.7)' : '#64748B',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            AI Video Generation
          </Text>
        ) : null}
      </View>
    </View>
  );
}
