import { Text, View, ScrollView } from "react-native";
import React from "react";
import { FeaturedCard } from "../../components/FeaturedCard";
import { Foot } from "../../components/Foot";
import { TitleOfPage } from "../../components/Categories/TitleOfPage";
import { HomeScreenGradient } from "@/components/Gradients";




export default function Index() {


  return (
    <View className="flex-1 mb-[1%] bg-themed">
      <HomeScreenGradient />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        className="items-center p-[10%] flex-1"
        >
        <TitleOfPage></TitleOfPage>
        <View className="w-[95%] max-w-[75%] px-[2%] mb-[3%]" style={{ borderLeftWidth: 4, borderLeftColor: "var(--color-tint)" }}>
          <Text className="detail-body text-themed">
            I help teams ship polished products across mobile, web, and game experiences—pairing strong UX instincts with reliable engineering. Every project gets the same rigor: thoughtful architecture, resilient data flows, and instrumentation so we can measure what matters.
          </Text>
          <Text className="detail-body text-secondary mt-[1%]">
            From rapid prototypes to production launches, I focus on maintainable systems, accessibility, and performance so features stay fast, inclusive, and easy to iterate.
          </Text>
        </View>
        
        {/* <View style={styles.homeContent}> */}
          <View className="items-center p-[2%] my-[2%]">
            <FeaturedCard></FeaturedCard>
          </View>
        
        <Foot></Foot>
      </ScrollView>
    </View>
  );
}

