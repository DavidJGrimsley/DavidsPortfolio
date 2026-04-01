import { View } from "react-native";
import { Image } from 'expo-image';
import React from "react";
import { FeaturedCard } from "../../components/FeaturedCard";
import { HomeScreenGradient } from "@/components/Gradients";
import { TabContainer } from "@/components/navigation/TabContainer";




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
        leadBody="Hello World, welcome to my website. I’m glad you’re here. I’ve built this website with Expo React Native, and I hope you enjoy the smooth experience I’ve worked to achieve. Regardless of the project, I pay close attention to details and spend time and care on the most important aspects such as architecture, resilient data flows, and a seamless user experience. From UI to the backend, I think about the user journey and how people will interact with the technology. I get user feedback early and often to prevent tunnel vision and stay in touch with what matters: building something people will want to use and enjoy using."
        leadSubBody="Please explore to find my portfolio projects including mobile apps, websites, games, and more. There are public-facing tools for all to use such as APIs and MCP servers. Your feedback on functionality and style is appreciated; a survey can be found on the contact page."
        seo={{
          title: 'Full-stack developer, websites, apps, APIs, and MCP tools',
          description:
            'David Grimsley builds fast, responsive websites and cross-platform apps. Explore portfolio work, public APIs, and Model Context Protocol (MCP) tools and servers.',
          path: '/',
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

