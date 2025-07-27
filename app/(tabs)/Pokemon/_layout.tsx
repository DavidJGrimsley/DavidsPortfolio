import { Stack } from 'expo-router';

export default function PokemonLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Pokemon',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
