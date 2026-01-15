import React from "react";
import { ScrollView, View } from "react-native";
import { Foot } from "@/components/Foot";
import { MyCards } from "@/components/Categories/MyCards";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";

type CategoryIndexWrapperProps = {
  titleA: string;
  titleB: string;
  category: string;
  introContent?: React.ReactNode;
  footerContent?: React.ReactNode;
};

export function CategoryIndexWrapper({
  titleA,
  titleB,
  category,
  introContent,
  footerContent,
}: CategoryIndexWrapperProps) {
  return (
    <View className="flex-1 items-center w-full bg-themed">
      <TitleOfPage titleA={titleA} titleB={titleB}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          className="grow w-full"
          contentContainerClassName="items-center"
        >
          <View className="page-content py-5">
            {introContent ? <View className="mb-[3%]">{introContent}</View> : null}
            <MyCards pageCategory={category} />
            {footerContent}
            <Foot />
          </View>
        </ScrollView>
      </TitleOfPage>
    </View>
  );
}
