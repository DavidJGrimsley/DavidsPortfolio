import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IframeEmbed } from '@/components/UI/IframeEmbed';
import { intakeForms } from '@/constants/intakeForms';
import { ThemedText } from '@/components/UI/ThemedText';
import { Pressable } from 'react-native';

export default function IntakeForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const form = id ? intakeForms[id] : undefined;

  if (!form) {
    return (
      <View className="flex-1 bg-themed items-center justify-center p-5">
        <ThemedText className="text-lg mb-4">Form not found</ThemedText>
        <Pressable
          className="bg-tint px-4 py-2 rounded-2"
          onPress={() => router.back()}
        >
          <ThemedText inverse>Go back</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <IframeEmbed src={form.formUrl} />
    </View>
  );
}
