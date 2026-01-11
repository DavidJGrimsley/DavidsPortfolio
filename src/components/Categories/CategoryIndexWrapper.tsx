import { Foot } from "@/components/Foot";
import { MyCards } from "@/components/Categories/MyCards";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { ScrollView, View } from "react-native";

type CategoryIndexWrapperProps = {
  titleA: string;
  titleB: string;
  category: string;
};

export function CategoryIndexWrapper({ titleA, titleB, category }: CategoryIndexWrapperProps) {
  return (
    <View className="flex-1 items-center w-full px-[1%] bg-themed">
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
