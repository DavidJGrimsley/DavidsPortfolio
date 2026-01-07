import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack>
        <Stack.Screen name="index" options={{
            headerTitle: "Software Development",
            headerShown: false,
        }}/>
        <Stack.Screen name="[title]" options={{
            headerTitle: "Software Development",
            headerShown: false,
            headerShadowVisible: false
        }}/>
    </Stack>
  );
}
