import { Foot } from "@/components/Foot";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { type Href, router } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 bg-themed">
      <TitleOfPage titleA="Website" titleB="Creation" />      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-grow items-center justify-center py-5 px-5"
      >
        {/* pressable to go to website creation intake */}
        <Pressable className="w-full max-w-180 p-4 rounded-xl mb-4" onPress={() => router.push('/(tabs)/more/about/(website-forms)/website-intake' as Href)}>
          <Text className="text-base text-center">Get your portfolio or website created here! Click to fill out the website intake form.</Text>
        </Pressable>
        {/* pressable to go to portfolio piece intake */}
        <Pressable className="w-full max-w-180 p-4 rounded-xl" onPress={() => router.push('/(tabs)/more/about/(website-forms)/portfolio-intake' as Href)}>
          <Text className="text-base text-center">Click here to enter the information for each of your portfolio pieces after you have filled out the website intake form.</Text>
        </Pressable>
        <Foot />
      </ScrollView>
    </View>
  );
}

