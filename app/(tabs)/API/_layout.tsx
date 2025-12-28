import { Stack } from "expo-router";
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from "@/constants/Colors";

export default function APIStackLayout() {
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
        name="quantum" 
        options={{
          headerTitle: "Quantum API Documentation",
          headerShadowVisible: false,
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }}
      />
    </Stack>
  );
}
