import { Stack } from "expo-router";
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from "@/constants/Colors";

export default function StackLayout() {
  const colorScheme = useColorScheme();
  return (
    <Stack>
        <Stack.Screen name="index" options={{
            headerShown: false,
        }}/>
        <Stack.Screen name="[title]" options={{
            headerTitle: "Web App & Site Development",
            headerShadowVisible: false,
            headerTintColor: Colors[colorScheme ?? 'light'].text,
        }}/>
        
    </Stack>
  );
}
