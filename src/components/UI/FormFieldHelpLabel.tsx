import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { OverlayTooltip } from '@/components/UI/OverlayTooltip';
import { ThemedText } from '@/components/UI/ThemedText';

type FormFieldHelpLabelProps = {
  helpText: string;
  label: string;
  required?: boolean;
};

export function FormFieldHelpLabel({
  helpText,
  label,
  required = false,
}: FormFieldHelpLabelProps) {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'secondary');

  return (
    <View className="mb-2 flex-row items-center justify-between gap-2">
      <View className="flex-row items-center">
        <ThemedText
          className="font-bold text-xs uppercase tracking-[0.12em]"
          style={{ color: secondaryColor }}
        >
          {label}
        </ThemedText>
        {required ? (
          <ThemedText className="ml-1 text-xs font-bold" style={{ color: '#f87171' }}>
            *
          </ThemedText>
        ) : null}
      </View>

      <OverlayTooltip
        content={helpText}
        side="top"
        triggerAccessibilityLabel={`About ${label}`}
        triggerStyle={{
          alignItems: 'center',
          backgroundColor: accentColor + '20',
          borderColor: tintColor + '55',
          borderCurve: 'continuous',
          borderRadius: 999,
          borderWidth: 1,
          height: 22,
          justifyContent: 'center',
          width: 22,
        }}
      >
        <Ionicons color={secondaryColor} name="information-circle-outline" size={14} />
      </OverlayTooltip>
    </View>
  );
}

