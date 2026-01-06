import React, { useState, useEffect } from 'react';
import { Foot } from "@/components/Foot";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { PokemonButtonCredit } from "@/components/PokemonButton";
import { GameBackgroundGradient } from "@/components/Gradients";
import { useColorScheme } from '@/hooks/useColorScheme';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Text, View, ScrollView, Pressable, Linking } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const title = `Shiny Wo-Chien Defeat Counter`;
const description = 'Click the button to increment the counter. Only click it if you\'ve really defeated it AND you were the host. This is the best way I can think of tracking it but it requires us to use the honor system. Please share this page!';
const disclaimer = `This counter is unofficial and separate from the official Pokemon event. The official event requires players worldwide to collectively defeat Shiny Wo-Chien one million times between July 22 and August 3, 2025. If this goal is met, a Shiny Wo-Chien will be distributed via Mystery Gift from August 7 to September 30, 2025. 

While offline victories are likely recorded locally and synchronized with the official count when you reconnect to the internet, to ensure your battles count: connect to the internet periodically during the event, check Poké Portal News for progress updates, and redeem your Mystery Gift during the distribution period if the goal is achieved.

This community counter helps us track progress but is not foolproof - there may be other players defeating Shiny Wo-Chien who aren't using this tracker. Let's aim for more than the required million to account for any missed contributions!
Remember, we get extra rewards for every 100,000 defeats beyond the first million, capping at 2 million for the maximum rewards.`;
// API base URL - change this to your VPS domain when deployed

export default function Pokemon() {
  return (
    <View className="flex-1">
      <GameBackgroundGradient />
      <TitleOfPage titleA="Pokemon" titleB="Center" />
      <View className="flex-1 items-center justify-center" style={{ minHeight: 400 }}> 
        <View style={{ backgroundColor: 'rgba(40,40,40,0.82)', borderRadius: 18, padding: 28, maxWidth: 600, width: '100%', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 24, color: '#fff' }}>
            Thank you for visiting!
          </Text>
          <Text style={{ fontSize: 20, textAlign: 'center', marginBottom: 18, color: '#fff' }}>
            The Shiny Wo-Chien Defeat Counter has moved.{"\n"}Please log your defeats at:
          </Text>
          <Pressable
            onPress={() => Linking.openURL('https://pokepages.app/events/wo-chien')}
            style={{ marginBottom: 18 }}
          >
            <Text selectable style={{ fontSize: 22, color: '#90caf9', fontWeight: 'bold', textAlign: 'center', textDecorationLine: 'underline' }}>
              pokepages.app/events/wo-chien
            </Text>
          </Pressable>
          <Text style={{ fontSize: 16, textAlign: 'center', color: '#a5d6a7', marginBottom: 18 }}>
            All your wins logged on this place previously will be added to the new site, so no progress is lost!
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center', color: '#eee', marginBottom: 10, maxWidth: 500 }}>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>What is Pokepages?</Text> Pokepages is your one-stop shop for all things Pokémon—track events, log your wins, discover new features, and connect with the Pokémon community! I made it using React Native and it's a passion project of mine. I hope you enjoy.
          </Text>
        </View>
      </View>
      <Foot />
    </View>
  );
}