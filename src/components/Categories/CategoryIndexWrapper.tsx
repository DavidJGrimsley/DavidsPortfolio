import React from "react";
import { MyCards } from "@/components/Categories/MyCards";
import { TabContainer } from "@/components/navigation/TabContainer";
import { landingSeoProps, type LandingPath } from '@/constants/landing-seo';

const categoryKeywords: Record<string, string[]> = {
  'mobile-apps': ['mobile app developer', 'React Native', 'Expo', 'iOS apps', 'Android apps'],
  'game-design': ['game design', 'UEFN', 'Unreal Engine', 'Unity', 'Roblox', 'Scratch'],
  'website-development': ['website building', 'web development', 'responsive design', 'SEO', 'business website'],
  'software-development': ['software development', 'APIs', 'backend development', 'TypeScript', 'architecture'],
};

type CategoryIndexWrapperProps = {
  titleA: string;
  titleB: string;
  category: string;
  introBody?: string;
  introSubBody?: string;
  footerContent?: React.ReactNode;
};

export function CategoryIndexWrapper({
  titleA,
  titleB,
  category,
  introBody,
  introSubBody,
  footerContent,
}: CategoryIndexWrapperProps) {
  return (
    <TabContainer
      titleA={titleA}
      titleB={titleB}
      leadBody={introBody}
      leadSubBody={introSubBody}
      contentClassName="py-5"
      seo={{
        keywords: [...(categoryKeywords[category] ?? []), 'portfolio', 'David Grimsley'],
        type: 'website',
        ...landingSeoProps(`/portfolio/${category}` as LandingPath),
      }}
    >
      <MyCards pageCategory={category} />
      {footerContent}
    </TabContainer>
  );
}
