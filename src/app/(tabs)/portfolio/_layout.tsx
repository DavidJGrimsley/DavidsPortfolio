import { Stack } from 'expo-router';

export default function PortfolioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="mobile-apps" />
      <Stack.Screen name="website-development" />
      <Stack.Screen name="game-design" />
      <Stack.Screen name="software-development" />
    </Stack>
  );
}
