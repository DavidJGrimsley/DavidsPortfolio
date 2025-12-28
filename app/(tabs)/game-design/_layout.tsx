import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack>
        <Stack.Screen name="index" options={{
            headerTitle: "Game Design",
            headerShown: false,
        }}/>
        <Stack.Screen name="[title]" options={{
            headerTitle: "Game Design",
            headerShadowVisible: false
        }}/>
    </Stack>
  );
}
