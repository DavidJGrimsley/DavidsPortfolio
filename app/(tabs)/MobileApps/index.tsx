import { Foot, MyCards, TitleOfPage } from "@/components/CustomComponents";
import { MobileBackgroundGradient, styles } from "@/constants/styles";
import { View, ScrollView } from "react-native";

export default function MobileApps() {
  return (
    <View style={styles.page}>
      <MobileBackgroundGradient></MobileBackgroundGradient>
      <TitleOfPage titleA="Mobile" titleB="Applications"></TitleOfPage>      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollCards}
        >
        <MyCards pageCategory={"MobileApps"}></MyCards>
        <Foot></Foot>
      </ScrollView>
    </View>
  );
}
