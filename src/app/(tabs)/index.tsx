import { View } from "react-native";
import { Image } from 'expo-image';
import React from "react";
import type { GenerateMetadataFunction } from 'expo-router/server';
import { landingMetadata, landingSeoProps } from '@/constants/landing-seo';

import { FeaturedCard } from "../../components/FeaturedCard";
import { HomeScreenGradient } from "@/components/Gradients";
import { TabContainer } from "@/components/navigation/TabContainer";

export const generateMetadata: GenerateMetadataFunction = () => landingMetadata('/');



export default function Index() {


  return (
    <View className="flex-1 bg-themed">
      <TabContainer
        titleA="David 'Mr. DJ' "
        titleB="Grimsley"
        background={<HomeScreenGradient />}
        overlayIcon={(
          <Image
            source={{ uri: '/images/Logo-TRANSPARENT-djPortfolio-prototype.png' }}
            contentFit="contain"
            style={{
              position: 'absolute',
              left: '40%',
              top: '-12%',
              width: '100%',
              height: '100%',
              opacity: 0.65,
            }}
          />
        )}
        overlayIconDelayMs={4100}
        overlayIconEnterDurationMs={1800}
        overlayIconTranslateX={120}
        leadBody="Hi, I'm David. I build websites, apps, games, and developer tools with care for the people who use them."
        leadSubBody="Explore my projects, try a public tool, or get in touch about an idea."
        seo={{
          keywords: [
            'website building',
            'website developer',
            'web development services',
            'freelance web developer',
            'React Native developer',
            'Expo',
            'API developer',
            'REST API',
            'what is an API',
            'MCP',
            'Model Context Protocol',
            'what is MCP',
            'AI tools',
          ],
          type: 'website',
          ...landingSeoProps('/'),
        }}
      >
        {/* <FireText text="DAVID GRIMSLEY" fontSize={48} /> */}
        <View className="items-center p-[2%] my-[2%]">
          <FeaturedCard></FeaturedCard>
        </View>
      </TabContainer>
    </View>
  );
}

