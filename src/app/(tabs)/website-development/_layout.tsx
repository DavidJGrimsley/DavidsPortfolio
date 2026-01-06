import { Stack } from "expo-router";
import { useColorScheme } from '@/hooks/useColorScheme';

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'light' ? '#11181C' : '#FEFEFE';
  
  return (
    <Stack>
        <Stack.Screen name="index" options={{
            headerShown: false,
        }}/>
        <Stack.Screen name="[title]" options={{
            headerTitle: "Web App & Site Development",
            headerShadowVisible: false,
            headerTintColor: textColor,
        }}/>
        
    </Stack>
  );
}
