import { Stack } from "expo-router";
import { useColorScheme } from '@/hooks/useColorScheme';

export default function APIStackLayout() {
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
          headerShadowVisible: false,
          headerTintColor: textColor,
        }}
      />
    </Stack>
  );
}
