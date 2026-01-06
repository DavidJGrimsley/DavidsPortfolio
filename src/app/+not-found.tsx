import { Link, Stack } from 'expo-router';

import { ThemedText } from '@/components/UI/ThemedText';
import { ThemedView } from '@/components/UI/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView className="flex-1 items-center justify-center p-5">
        <ThemedText type="title">Sorry, this screen doesn't exist. This shouldn't have happened. I'm embarrassed. </ThemedText>
        <Link href="/" className="mt-4 py-4">
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}
