import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';

type InfoCardProps = {
  icon: string;
  title: string;
  paragraphs: string[];
};

export function InfoCard({ icon, title, paragraphs }: InfoCardProps) {
  return (
    <View className="bg-accent rounded-xl p-5 border-2 border-tint/40">
      <View className="flex-row items-center mb-3">
        <ThemedText className="text-3xl mr-2.5">
          {icon}
        </ThemedText>
        <ThemedText type="subtitle" className="text-xl">
          {title}
        </ThemedText>
      </View>
      {paragraphs.map((paragraph, index) => (
        <ThemedText 
          key={index}
          className={`text-base opacity-80 leading-6 ${index < paragraphs.length - 1 ? 'mb-3' : ''}`}
        >
          {paragraph}
        </ThemedText>
      ))}
    </View>
  );
}
