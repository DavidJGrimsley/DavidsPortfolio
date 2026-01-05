import { Foot, MyCards, TitleOfPage } from "@/components/CustomComponents";
import { MobileBackgroundGradient } from "@/constants/styles";
import { View, ScrollView } from "react-native";

export default function MobileApps() {
  return (
    <View className="flex-1 items-center w-full px-[1%]">
      <MobileBackgroundGradient></MobileBackgroundGradient>
      <TitleOfPage titleA="Mobile" titleB="Applications"></TitleOfPage>      
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          className="grow justify-evenly items-center py-5"
          >
          <View className="w-full max-w-300">
            <MyCards pageCategory={"mobile-apps"}></MyCards>
          </View>
          <Foot></Foot>
        </ScrollView>
    </View>
  );
}
