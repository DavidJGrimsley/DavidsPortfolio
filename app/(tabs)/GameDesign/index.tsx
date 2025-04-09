import { Foot, MyCards, TitleOfPage } from "@/components/CustomComponents";
import { ScrollView, View } from "react-native";
import { GameBackgroundGradient, MobileBackgroundGradient, styles } from '../../../constants/styles';

export default function GameDesign() {
  return (
    <View style={styles.page}>
      <GameBackgroundGradient></GameBackgroundGradient>
      <TitleOfPage titleA="Game" titleB="Design"></TitleOfPage>      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollCards}
        >
        <MyCards pageCategory={"GameDesign"}></MyCards>
       
        <Foot></Foot>
      </ScrollView>
  </View>
  );
}
