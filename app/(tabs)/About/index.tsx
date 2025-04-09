import { TitleOfPage, UnderConstruction, Foot } from "@/components/CustomComponents";
import { styles, GameBackgroundGradient } from "@/constants/styles";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

type Routes = '/(tabs)/About/survey' | '/(tabs)/About/(website-forms)';

export default function Index() {
  return (
    <View style={styles.page}>
    <GameBackgroundGradient></GameBackgroundGradient>
    <TitleOfPage titleA="About" titleB="me"></TitleOfPage>      
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollCards}
      >
       <UnderConstruction/>
        {/* Link to download resume */}
        <a style={{ fontSize: 40 }} href="/files/resumeMobile.pdf" download>Download Resume</a>
        {/* pressable to go to website forms index */}
        
        <View style={styles.website}>
          <Text style={styles.websiteText}>If you are interested in having a website made, please </Text>
          <Pressable style={styles.websiteButton} onPress={() => router.push('/(tabs)/About/(website-forms)' as Routes)}>
            <Text style={styles.websiteButtonText} >click here</Text>
          </Pressable>
          <Text style={styles.websiteText}> and I will get back to you as soon as possible.</Text>
        </View>
        {/* pressable to go to Survey */}
        <View style={styles.surveyView}>
          <Text style={styles.aboutText}>After you have visited the site for a while or have fulfilled your purpose of coming here, please take 2 minutes to fill out this usability survey so that I might take your suggestions and make a better website and experience.</Text>
          <Pressable style={styles.survey} onPress={() => router.push('/(tabs)/About/survey' as Routes)}>
          <Text style={styles.surveyText}>Survey</Text>
          
        </Pressable>
        </View>
      {/* </Container> */}
      <Foot></Foot>
    </ScrollView>
  </View>
  );
}
