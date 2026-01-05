import { Foot, MyCards, TitleOfPage } from "@/components/CustomComponents";
import { ScrollView, View } from "react-native";
import { GameBackgroundGradient } from '../../../constants/styles';

export default function GameDesign() {
  return (
    <View className="flex-1 items-center w-full px-[1%]">
      <GameBackgroundGradient></GameBackgroundGradient>
      <TitleOfPage titleA="Game" titleB="Design"></TitleOfPage>      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        className="grow justify-evenly items-center py-5"
        >
        <MyCards pageCategory={"game-design"}></MyCards>
       
        <Foot></Foot>
      </ScrollView>
  </View>
  );
}
