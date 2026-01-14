import React from "react";
import { ScrollView, View } from "react-native";
import { Foot } from "@/components/Foot";
import { MyCards } from "@/components/Categories/MyCards";
import { ThemedText } from "@/components/UI/ThemedText";

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
      <View className="w-full max-w-[90%] px-[1%]">
        <ThemedText
          headingLevel={1}
          visualHeadingLevel={1}
          className="text-center"
          aria={`${titleA} ${titleB}`}
        >
          {titleA} {titleB}
        </ThemedText>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="grow w-full"
        contentContainerClassName="items-center"
      >
          {introContent ? <View className="mb-[3%]">{introContent}</View> : null}
        <View className="w-full max-w-[85%] px-[1%] py-5">
          
            <MyCards pageCategory={category} />
          {footerContent}
          <Foot />
        </View>
      </ScrollView>
    </View>
  );
}
