import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{
        headerShown: false,
      }}/>
      <Stack.Screen name="(website-forms)" options={{
        headerShown: true,
        title: '',
        headerTransparent: true,
      }}
      />
      <Stack.Screen name="survey" options={{
        headerShown: true,
        title: 'Survey',
      }}
      />
    </Stack>
  );
}