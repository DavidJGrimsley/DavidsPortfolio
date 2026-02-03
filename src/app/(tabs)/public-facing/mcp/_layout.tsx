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
        name="[id]" 
        options={{
          headerShown: false,
          headerTintColor: textColor,
        }}
      />
    </Stack>
  );
}
