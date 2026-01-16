import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{
        headerShown: false,
      }}/>
      <Stack.Screen name="[intake]" options={{
        headerShown: false,
        title: 'Intake Form',
      }}
      />
      <Stack.Screen name="learn" options={{
        headerShown: false,
        title: 'Tutoring',
      }}
      />
      <Stack.Screen name="survey" options={{
        headerShown: false,
        title: 'Survey',
      }}
      />
    </Stack>
  );
}