import { View, ScrollView } from "react-native";
import React from "react";
import { FeaturedCard } from "../../components/FeaturedCard";
import { Foot } from "../../components/Foot";
import { HomeScreenGradient } from "@/components/Gradients";
import { ThemedText } from "@/components/UI/ThemedText";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";




export default function Index() {


  return (
    <View className="flex-1 mb-[1%] bg-themed">
      <HomeScreenGradient />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        contentContainerClassName="items-center py-[10%]"
        >
        <TitleOfPage titleA="David" titleB="Grimsley">
          {/* <FireText text="DAVID GRIMSLEY" fontSize={48} /> */}
          <View className="page-content">
            <View className="page-lead mb-[3%]">
              <ThemedText className="detail-body">
                I help teams ship polished products across mobile, web, and game experiences—pairing strong UX instincts with reliable engineering. Every project gets the same rigor: thoughtful architecture, resilient data flows, and instrumentation so we can measure what matters.
              </ThemedText>
              <ThemedText className="detail-body text-secondary mt-[1%]">
                From rapid prototypes to production launches, I focus on maintainable systems, accessibility, and performance so features stay fast, inclusive, and easy to iterate.
              </ThemedText>
            </View>

            {/* <View style={styles.homeContent}> */}
            <View className="items-center p-[2%] my-[2%]">
              <FeaturedCard></FeaturedCard>
            </View>

            <Foot></Foot>
          </View>
        </TitleOfPage>
      </ScrollView>
    </View>
  );
}

