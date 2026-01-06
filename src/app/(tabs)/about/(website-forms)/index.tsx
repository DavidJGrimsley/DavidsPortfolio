import { Foot } from "@/components/Foot";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { GameBackgroundGradient } from "@/components/Gradients";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

type Routes = '/(tabs)/about/(website-forms)/website-intake' | '/(tabs)/about/(website-forms)/portfolio-intake';

export default function Index() {
  return (
    <View className="flex-1">
      <GameBackgroundGradient />
      <TitleOfPage titleA="Website" titleB="Creation" />      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-grow items-center justify-center py-5 px-5"
      >
        {/* pressable to go to website creation intake */}
        <Pressable className="w-full max-w-[720px] p-4 rounded-xl mb-4" onPress={() => router.push('/(tabs)/about/(website-forms)/website-intake' as Routes)}>
          <Text className="text-base text-center">Get your portfolio or website created here! Click to fill out the website intake form.</Text>
        </Pressable>
        {/* pressable to go to portfolio piece intake */}
        <Pressable className="w-full max-w-[720px] p-4 rounded-xl" onPress={() => router.push('/(tabs)/about/(website-forms)/portfolio-intake' as Routes)}>
          <Text className="text-base text-center">Click here to enter the information for each of your portfolio pieces after you have filled out the website intake form.</Text>
        </Pressable>
        <Foot />
      </ScrollView>
    </View>
  );
}

