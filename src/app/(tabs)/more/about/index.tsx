import { Foot } from "@/components/Foot";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { GameBackgroundGradient } from "@/components/Gradients";
import React from "react";
import { Pressable, ScrollView, Text, View, Dimensions } from "react-native";
import { router } from "expo-router";

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;

export default function Index() {
  return (
    <View className="flex-1">
      <GameBackgroundGradient />
      <TitleOfPage titleA="About" titleB="me" />      
      <ScrollView 
        className="flex-1 w-full"
        contentContainerClassName="flex-grow justify-center items-center py-5 px-5 min-h-full"
        showsVerticalScrollIndicator={false}
      >
        <View className={`${isMobile ? 'flex-col' : 'flex-row'} justify-around items-center w-full max-w-300`}>
          {/* About text section */}
          <View className={`${isMobile ? 'w-full my-5' : 'w-[45%]'} items-center justify-center`}>
            <Text className="text-lg text-themed text-center max-w-130">I have come to love programming over the last few years. I enjoy the satisfaction of making a design and functionality work together. I also enjoy making games and look forward to making more Fortnite Experiences in my spare time soon.</Text>
          </View>

          {/* Right side content */}
          <View className={`${isMobile ? 'w-full' : 'w-[45%]'} items-center justify-center`}>
            {/* Resume download section */}
            <View className="items-center my-5">
              <a className="text-10 text-tint underline" href="/files/DavidGrimsleyResume.pdf" download>Download Resume</a>          
            </View>

            {/* Website services section */}
            <View className="w-full max-w-130 p-4 rounded-xl my-5">
              <Text className="text-base text-themed text-center">If you are interested in having a website made, please
              <Pressable className="self-center px-3 py-2 rounded-2.5 my-2.5" onPress={() => router.push('/(tabs)/about/(website-forms)')}>
                <Text className="text-base font-bold text-themed">Click Here!</Text>
              </Pressable>
              and I will get back to you as soon as possible.</Text>
            </View>

            {/* Survey section */}
            <View className="w-full max-w-130 p-4 rounded-xl my-5">
              <Text className="text-base text-themed text-center mb-3">After you have visited the site for a while or have fulfilled your purpose of coming here, please take 2 minutes to fill out this usability survey so that I might take your suggestions and make a better website and experience.</Text>
              <Pressable className="self-center px-4 py-2.5 rounded-2.5" onPress={() => router.push('/(tabs)/about/survey')}>
                <Text className="text-base font-bold text-themed">Survey</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      <Foot />
    </View>
  );
}

