import { Stack } from 'expo-router';

export default function PublicFacingLayout() {
  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="api" />
        <Stack.Screen name="mcp" />
        <Stack.Screen name="production" />
      </Stack>
  );
}
