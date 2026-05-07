import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Polygon,
  Circle,
} from 'react-native-svg';

interface Props {
  size?: number;
  /** When true, hides the small star accent (use on tiny sizes < 22px). */
  iconOnly?: boolean;
}

/**
 * SnapViral mark — red play triangle with three motion arcs swooping outward
 * and a small star accent at the top-right. The wordmark "SnapViral" is
 * rendered as a separate <Text> next to this icon by callers.
 */
export function SnapViralLogo({ size = 32 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="snapRed" x1="6" y1="6" x2="56" y2="58">
          <Stop offset="0" stopColor="#FF2D38" />
          <Stop offset="1" stopColor="#C8102E" />
        </LinearGradient>
        <LinearGradient id="snapStar" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF6B6B" />
          <Stop offset="1" stopColor="#E53935" />
        </LinearGradient>
      </Defs>

      {/* Play triangle filled with red gradient */}
      <Polygon
        points="14,12 14,52 46,32"
        fill="url(#snapRed)"
        stroke="#A50C1F"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />

      {/* Three motion arcs trailing right (lower curves like in the mark) */}
      <Path
        d="M30 50 Q 50 50 60 38"
        stroke="url(#snapRed)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M26 56 Q 50 58 60 46"
        stroke="url(#snapRed)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <Path
        d="M22 60 Q 48 62 58 54"
        stroke="url(#snapRed)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Small star accent at top-right of the triangle */}
      <Path
        d="M48 6 L49.5 11 L54.5 11 L50.5 14 L52 19 L48 16 L44 19 L45.5 14 L41.5 11 L46.5 11 Z"
        fill="url(#snapStar)"
      />
      <Circle cx="48" cy="12.5" r="0.8" fill="#FFFFFF" opacity="0.9" />
    </Svg>
  );
}
