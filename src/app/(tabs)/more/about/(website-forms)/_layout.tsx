import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{
        headerShown: false,
      }}/>
      <Stack.Screen name="website-intake" options={{
        headerShown: true,
        title: '',
        headerTransparent: true,
      }}/>
      <Stack.Screen name="portfolio-intake" options={{
        headerShown: true,
        title: '',
        headerTransparent: true,
    }} />
    </Stack>
  );
}