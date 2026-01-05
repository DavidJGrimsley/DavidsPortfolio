import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { styles } from '@/constants/styles';

export default function MCPLayout() {
  const colorScheme = useColorScheme();

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
          headerStyle: styles.headerBackground,          
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }}
      />
      <Stack.Screen
        name="mrdj-pokemon-mcp"
        options={{
          headerTitle: 'mrdj-pokemon-mcp Documentation',
          headerShadowVisible: false,
          headerStyle: styles.headerBackground,
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }}
      />
    </Stack>
  );
}
