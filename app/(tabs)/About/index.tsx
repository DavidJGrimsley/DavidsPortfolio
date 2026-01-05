import { Foot } from "@/components/Foot";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { UnderConstruction } from "@/components/UI/UnderConstruction";
import { styles, GameBackgroundGradient } from "@/constants/styles";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;

type Routes = '/(tabs)/About/survey' | '/(tabs)/About/(website-forms)';

export default function Index() {
  console.log(isMobile, screenWidth);
  return (
    <View style={styles.page}>
    <GameBackgroundGradient></GameBackgroundGradient>
    <TitleOfPage titleA="About" titleB="me"></TitleOfPage>      
    <ScrollView 
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        minHeight: '100%',
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        maxWidth: 1200,
      }}>
        {/* About text section */}
        <View style={{ 
          width: isMobile ? '100%' : '45%', 
          alignItems: 'center', 
          marginVertical: isMobile ? 20 : 0,
          justifyContent: 'center'
        }}>
          <Text style={styles.aboutText}>I have come to love programming over the last few years. I enjoy the satisfaction of making a design and functionality work together. I also enjoy making games and look forward to making more Fortnite Experiences in my spare time soon.</Text>
        </View>

        {/* Right side content */}
        <View style={{ 
          width: isMobile ? '100%' : '45%', 
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Resume download section */}
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <a style={{ fontSize: 40, color: '#007AFF', textDecorationLine: 'underline' }} href="/files/DavidGrimsleyResume.pdf" download>Download Resume</a>          
          </View>

          {/* Website services section */}
          <View style={[styles.website, { marginVertical: 20 }]}>
            <Text style={styles.websiteText}>If you are interested in having a website made, please
            <Pressable style={styles.websiteButton} onPress={() => router.push('/(tabs)/About/(website-forms)' as Routes)}>
              <Text style={styles.websiteButtonText} >Click Here!</Text>
            </Pressable>
            and I will get back to you as soon as possible.</Text>
          </View>

          {/* Survey section */}
          <View style={[styles.surveyView, { marginVertical: 20 }]}>
            <Text style={styles.text}>After you have visited the site for a while or have fulfilled your purpose of coming here, please take 2 minutes to fill out this usability survey so that I might take your suggestions and make a better website and experience.</Text>
            <Pressable style={styles.survey} onPress={() => router.push('/(tabs)/About/survey' as Routes)}>
              <Text style={styles.surveyText}>Survey</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
      <Foot></Foot>
    </View>
  );
}
