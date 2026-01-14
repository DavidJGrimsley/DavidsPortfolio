import React, { useId } from 'react';
import { View } from 'react-native';

interface FireTextProps {
  text: string;
  fontSize?: number;
  gifUrl?: string;
  intensity?: number;
}

const DEFAULT_GIF_URL =
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExa29lY3prcTJwbDZlenY3dzdnOHY4aHJhM3R4NzczaHhyZWk1N2EwOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mRN4z5je2Ly6Mjvr0s/giphy.gif';

export function FireText({
  text,
  fontSize = 60,
  gifUrl = DEFAULT_GIF_URL,
  intensity = 12,
}: FireTextProps) {
  const displayText = text.toUpperCase();
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const patternId = `firetext-gif-${safeId}`;
  const wavyId = `firetext-wavy-${safeId}`;
  const glowId = `firetext-glow-${safeId}`;

  const width = 900;
  const height = 220;
  const svgHeight = Math.max(44, Math.round(fontSize * 1.7));
  const y = 140;

  return (
    <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={svgHeight}
        role="img"
        aria-label={displayText}
      >
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
            <image
              href={gifUrl}
              xlinkHref={gifUrl}
              x={0}
              y={0}
              width={width}
              height={height}
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Adds motion even if the GIF doesn't animate in some contexts */}
              <animateTransform
                attributeName="transform"
                type="translate"
                dur="2.2s"
                values="0 -18; 0 18; 0 -18"
                repeatCount="indefinite"
              />
            </image>
          </pattern>

          <filter id={wavyId} x="-25%" y="-60%" width="150%" height="220%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={2} result="noise">
              <animate attributeName="baseFrequency" dur="1.6s" values="0.010;0.020;0.012" repeatCount="indefinite" />
              <animate attributeName="seed" dur="0.22s" values="1;2;3;4;5;6;7;8;9;10" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={intensity} xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id={glowId} x="-40%" y="-90%" width="180%" height="280%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 0.35 0 0 0
                0 0 0.08 0 0
                0 0 0 0.9 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow/edge layer */}
        <text
          x="50%"
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight={900}
          letterSpacing={2}
          fill="#ff5a00"
          opacity={0.55}
          filter={`url(#${glowId})`}
        >
          {displayText}
        </text>

        {/* Main GIF-filled + wavy layer */}
        <text
          x="50%"
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight={900}
          letterSpacing={2}
          fill={`url(#${patternId})`}
          filter={`url(#${wavyId})`}
        >
          {displayText}
        </text>
      </svg>
    </View>
  );
}
