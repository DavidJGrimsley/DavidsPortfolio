import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';

export default function MCPLayout() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'light' ? '#11181C' : '#FEFEFE';

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="mrdj-app-mcp"
        options={{
          headerTitle: 'mrdj-app-mcp Documentation',
          headerShadowVisible: false,
          headerTintColor: textColor,
        }}
      />
      <Stack.Screen
        name="mrdj-pokemon-mcp"
        options={{
          headerTitle: 'mrdj-pokemon-mcp Documentation',
          headerShadowVisible: false,
          headerTintColor: textColor,
        }}
      />
    </Stack>
  );
}
