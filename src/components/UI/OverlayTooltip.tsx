import React, { useMemo, useState } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import * as Tooltip from 'universal-tooltip';

import { useThemeColor } from '@/hooks/useThemeColor';

type OverlayTooltipProps = {
  children: React.ReactNode;
  content: string;
  maxWidth?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  triggerAccessibilityLabel: string;
  triggerStyle?: StyleProp<ViewStyle>;
};

export function OverlayTooltip({
  children,
  content,
  maxWidth = 320,
  side = 'top',
  sideOffset = 8,
  triggerAccessibilityLabel,
  triggerStyle,
}: OverlayTooltipProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const tooltipBackgroundColor = useMemo(
    () => (backgroundColor === '#fff' ? '#111827' : '#f8fafc'),
    [backgroundColor]
  );
  const tooltipTextColor = useMemo(
    () => (tooltipBackgroundColor === '#111827' ? '#f8fafc' : '#111827'),
    [tooltipBackgroundColor]
  );

  const isOpen = isPinned || isHovered || isFocused;

  return (
    <Tooltip.Root
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setIsPinned(false);
        }
      }}
      open={isOpen}
    >
      <Tooltip.Trigger>
        <Pressable
          accessibilityLabel={triggerAccessibilityLabel}
          accessibilityRole="button"
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          onPress={() => setIsPinned((current) => !current)}
          style={({ pressed }) => [
            triggerStyle,
            {
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          {children}
        </Pressable>
      </Tooltip.Trigger>

      <Tooltip.Portal>
        <Tooltip.Content
          backgroundColor={tooltipBackgroundColor}
          borderRadius={10}
          containerStyle={{
            paddingBottom: 8,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
          }}
          maxWidth={maxWidth}
          onTap={() => setIsPinned(false)}
          presetAnimation="fadeIn"
          side={side}
          sideOffset={sideOffset}
          style={{
            borderColor: tintColor + '55',
            borderWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
          }}
        >
          <Tooltip.Text
            style={{
              color: tooltipTextColor,
              fontSize: 13,
              lineHeight: 18,
            }}
            text={content}
          />
          <Tooltip.Arrow backgroundColor={tooltipBackgroundColor} height={8} width={10} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
