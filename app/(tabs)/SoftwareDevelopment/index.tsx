import { Foot, MyCards, TitleOfPage } from "@/components/CustomComponents";
import { ScrollView, View } from "react-native";
import { GameBackgroundGradient, styles } from '../../../constants/styles';

export default function SoftwareDevelopment() {
  return (
    <View style={styles.page}>
      <GameBackgroundGradient></GameBackgroundGradient>
      <TitleOfPage titleA="Software" titleB="Development"></TitleOfPage>      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollCards}
        >
        <MyCards pageCategory={"SoftwareDevelopment"}></MyCards>
       
        <Foot></Foot>
      </ScrollView>
  </View>
  );
}
