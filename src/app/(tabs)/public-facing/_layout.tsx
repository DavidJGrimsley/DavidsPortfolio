import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function PublicFacingLayout() {
  return (
    <View style={{ width: '90%' , flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="api" />
        <Stack.Screen name="mcp" />
        <Stack.Screen name="production" />
      </Stack>
    </View>
  );
}
