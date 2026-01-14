import React from 'react';
import { Foot } from "@/components/Foot";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { ThemedText } from "@/components/UI/ThemedText";
import { View, Pressable, Linking } from "react-native";

export default function Pokemon() {
  return (
    <View className="flex-1 bg-themed">
      <TitleOfPage titleA="Pokemon" titleB="Center" />
      <View className="flex-1 items-center justify-center min-h-[400px]"> 
        <View className="bg-accent/80 rounded-2xl p-7 max-w-[600px] w-full items-center">
          <ThemedText headingLevel={1} visualHeadingLevel={1} className="text-3xl font-bold text-center my-6">
            Thank you for visiting!
          </ThemedText>
          <ThemedText className="text-xl text-center mb-4">
            The Shiny Wo-Chien Defeat Counter has moved.{"\n"}Please log your defeats at:
          </ThemedText>
          <Pressable
            onPress={() => Linking.openURL('https://pokepages.app/events/wo-chien')}
            className="mb-4"
          >
            <ThemedText selectable className="text-2xl text-tint font-bold text-center underline">
              pokepages.app/events/wo-chien
            </ThemedText>
          </Pressable>
          <ThemedText className="text-base text-center text-success mb-4">
            All your wins logged on this place previously will be added to the new site, so no progress is lost!
          </ThemedText>
          <ThemedText className="text-base text-center mb-2 max-w-[500px]">
            <ThemedText className="font-bold">What is Pokepages?</ThemedText> Pokepages is your one-stop shop for all things Pokémon—track events, log your wins, discover new features, and connect with the Pokémon community! I made it using React Native and it's a passion project of mine. I hope you enjoy.
          </ThemedText>
        </View>
      </View>
      <Foot />
    </View>
  );
}