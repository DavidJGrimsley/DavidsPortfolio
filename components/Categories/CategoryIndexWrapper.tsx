import { Foot } from "@/components/Foot";
import { MyCards } from "@/components/Categories/MyCards";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { ScrollView, View } from "react-native";
import { ReactElement } from "react";

type CategoryIndexWrapperProps = {
  gradient: ReactElement;
  titleA: string;
  titleB: string;
  category: string;
};

export function CategoryIndexWrapper({ gradient, titleA, titleB, category }: CategoryIndexWrapperProps) {
  return (
    <View className="flex-1 items-center w-full px-[1%]">
      {gradient}
      <TitleOfPage titleA={titleA} titleB={titleB} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="grow justify-evenly items-center py-5"
      >
        <MyCards pageCategory={category} />
        <Foot />
      </ScrollView>
    </View>
  );
}
