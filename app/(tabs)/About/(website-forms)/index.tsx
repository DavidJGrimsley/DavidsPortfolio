import { TitleOfPage, UnderConstruction, Foot } from "@/components/CustomComponents";
import { styles, GameBackgroundGradient } from "@/constants/styles";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

type Routes = '/(tabs)/About/(website-forms)/website-intake' | '/(tabs)/About/(website-forms)/portfolio-intake';

export default function Index() {
  return (
    <View style={styles.page}>
    <GameBackgroundGradient></GameBackgroundGradient>
    <TitleOfPage titleA="Website" titleB="Creation"></TitleOfPage>      
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollCards}
      >
        {/* pressable to go to website creation intake */}
        <Pressable style={styles.website} onPress={() => router.push('/(tabs)/About/(website-forms)/website-intake' as Routes)}>
          <Text style={styles.websiteText}>Get your portfolio website created here! Click to fill out the website intake form.</Text>
        </Pressable>
        {/* pressable to go to portfolio piece intake */}
        <Pressable style={styles.survey} onPress={() => router.push('/(tabs)/About/(website-forms)/portfolio-intake' as Routes)}>
          <Text style={styles.surveyText}>Click here to enter the information for each of your portfolio pieces after you have filled out the website intake form.</Text>
        </Pressable>
      {/* </Container> */}
      <Foot></Foot>
    </ScrollView>
  </View>
  );
}
