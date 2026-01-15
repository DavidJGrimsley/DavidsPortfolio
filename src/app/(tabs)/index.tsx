import { View } from "react-native";
import React from "react";
import { FeaturedCard } from "../../components/FeaturedCard";
import { HomeScreenGradient } from "@/components/Gradients";
import { ThemedText } from "@/components/UI/ThemedText";
import { TabContainer } from "@/components/Navigation/TabContainer";




export default function Index() {


  return (
    <View className="flex-1 mb-[1%] bg-themed">
      <TabContainer
        titleA="David"
        titleB="Grimsley"
        background={<HomeScreenGradient />}
        lead={
          <>
            <ThemedText className="detail-body">
              I help teams ship polished products across mobile, web, and game experiences—pairing strong UX instincts with reliable engineering. Every project gets the same rigor: thoughtful architecture, resilient data flows, and instrumentation so we can measure what matters.
            </ThemedText>
            <ThemedText className="detail-body text-secondary mt-[1%]">
              From rapid prototypes to production launches, I focus on maintainable systems, accessibility, and performance so features stay fast, inclusive, and easy to iterate.
            </ThemedText>
          </>
        }
      >
        {/* <FireText text="DAVID GRIMSLEY" fontSize={48} /> */}
        <View className="items-center p-[2%] my-[2%]">
          <FeaturedCard></FeaturedCard>
        </View>
      </TabContainer>
    </View>
  );
}

