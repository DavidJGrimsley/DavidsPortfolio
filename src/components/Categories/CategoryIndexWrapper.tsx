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
    <View className="flex-1 items-center w-full bg-themed">
      <View className="w-full max-w-[90%] px-[1%]">
        <TitleOfPage titleA={titleA} titleB={titleB} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="grow w-full"
        contentContainerClassName="items-center"
      >
        <View className="w-full max-w-[90%] px-[1%] py-5">
          <MyCards pageCategory={category} />
          <Foot />
        </View>
      </ScrollView>
    </View>
  );
}
