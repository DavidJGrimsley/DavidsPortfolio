import { Foot } from "@/components/Foot";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { ThemedText } from "@/components/UI/ThemedText";
import React from "react";
import { Pressable, ScrollView, View, Dimensions } from "react-native";
import { type Href, router } from "expo-router";
import { TabContainer } from "@/components/Navigation/TabContainer";

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;

export default function Index() {
  return (
    <TabContainer>
      <View className="flex-1 bg-themed">
        <TitleOfPage titleA="Contact" titleB="me">
          <ScrollView
            className="flex-1"
            contentContainerClassName="items-center py-[10%]"
            showsVerticalScrollIndicator={false}
          >
            <View className={`${isMobile ? 'flex-col' : 'flex-row'} page-content justify-around items-center`}>
              {/* Contact text section */}
              <View className={`${isMobile ? 'w-full my-5' : 'w-[45%]'} items-center justify-center`}>
                <View className="page-lead">
                  <ThemedText className="detail-body text-left">
                    I have come to love programming over the last few years. I enjoy the satisfaction of making a design and functionality work together. I also enjoy making games and look forward to making more Fortnite Experiences in my spare time soon.
                  </ThemedText>
                </View>
              </View>
              {/* Right side content */}
              <View className={`${isMobile ? 'w-full' : 'w-[45%]'} items-center justify-center`}>
                {/* Resume download section */}
                <View className="items-center my-5">
                  <a className="text-base text-tint underline" href="/files/DavidGrimsleyResume.pdf" download>Download Resume</a>
                </View>
                {/* Survey section */}
                <View className="w-full max-w-130 p-4 rounded-xl my-5 bg-accent">
                  <ThemedText className="text-base text-center mb-3">After you have visited the site for a while or have fulfilled your purpose of coming here, please take 2 minutes to fill out this usability survey so that I might take your suggestions and make a better website and experience.</ThemedText>
                  <Pressable className="self-center px-4 py-2.5 rounded-2.5 bg-tint" onPress={() => router.push('/(tabs)/services/survey' as Href)}>
                    <ThemedText inverse className="text-base font-bold">Survey</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
          <Foot />
        </TitleOfPage>
      </View>
    </TabContainer>
  );
}

