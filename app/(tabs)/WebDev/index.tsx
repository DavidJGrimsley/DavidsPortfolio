import { Foot, MyCards, TitleOfPage } from "@/components/CustomComponents";
import { ScrollView, View } from "react-native";
import { MobileBackgroundGradient, styles, WebBackgroundGradient } from '../../../constants/styles';

export default function WebDev() {
  return (
    <View style={styles.page}>
    <WebBackgroundGradient></WebBackgroundGradient>
    <TitleOfPage titleA="Web" titleB="Development"></TitleOfPage>      
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollCards}
      >
      {/* <Container style={styles.cardsContainer}> */}
        <MyCards pageCategory={"WebDev"}></MyCards>
      {/* </Container> */}
      <Foot></Foot>
    </ScrollView>
  </View>
  );
}
