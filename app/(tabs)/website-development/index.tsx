import { Foot, MyCards, TitleOfPage } from "@/components/CustomComponents";
import { ScrollView, View } from "react-native";
import { WebBackgroundGradient } from '../../../constants/styles';

export default function WebDev() {
  return (
    <View className="flex-1 items-center w-full px-[1%]">
    <WebBackgroundGradient></WebBackgroundGradient>
    <TitleOfPage titleA="Web" titleB="Development"></TitleOfPage>      
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      showsHorizontalScrollIndicator={false}
      className="grow justify-evenly items-center py-5"
      >
      {/* <Container style={styles.cardsContainer}> */}
        <MyCards pageCategory={"website-development"}></MyCards>
      {/* </Container> */}
      <Foot></Foot>
    </ScrollView>
  </View>
  );
}
