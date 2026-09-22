import { Stack } from "expo-router";

export default function APIStackLayout() {
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
        }}
      />
      <Stack.Screen
        name="quantum/auth"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="quantum/[slug]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
