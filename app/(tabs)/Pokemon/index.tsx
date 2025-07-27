import React, { useState, useEffect } from 'react';
import { Foot, TitleOfPage } from "@/components/CustomComponents";
import { PokemonButtonCredit } from "@/components/PokemonButton";
import { GameBackgroundGradient, styles } from "@/constants/styles";
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Text, StyleSheet, View, ScrollView, Pressable, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Pokemon() {
  const [globalCount, setGlobalCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [playerId, setPlayerId] = useState('');
  const colorScheme = useColorScheme();
  
  const title = `Shiny Wo-Chien Defeat Counter`;
  const description = 'Click the button to increment the counter. Only click it if you\'ve really defeated it AND you were the host. This is the best way I can think of tracking it but it requires us to use the honors system. Please share this page!';
  const disclaimer = `This counter is unofficial and separate from the official Pokemon event. The official event requires players worldwide to collectively defeat Shiny Wo-Chien one million times between July 22 and August 3, 2025. If this goal is met, a Shiny Wo-Chien will be distributed via Mystery Gift from August 7 to September 30, 2025. 

While offline victories are likely recorded locally and synchronized with the official count when you reconnect to the internet, to ensure your battles count: connect to the internet periodically during the event, check Poké Portal News for progress updates, and redeem your Mystery Gift during the distribution period if the goal is achieved.

This community counter helps us track progress but is not foolproof - there may be other players defeating Shiny Wo-Chien who aren't using this tracker. Let's aim for more than the required million to account for any missed contributions!
Remember, we get extra rewards for every 100,000 defeats beyond the first million, capping at 2 million for the maximum rewards.`;
  // API base URL - change this to your VPS domain when deployed
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://davidjgrimsley.com/api' 
    : 'http://localhost:3001';

  // Generate or retrieve player ID
  const generatePlayerId = () => {
    return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  };

  // Cross-platform storage functions
  const getStorageItem = async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error getting storage item:', error);
      return null;
    }
  };

  const setStorageItem = async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting storage item:', error);
    }
  };

  useEffect(() => {
    initializePlayer();
  }, []);

  useEffect(() => {
    if (playerId) {
      fetchCounter();
      // Optional: Set up polling to get real-time updates every 30 seconds
      const interval = setInterval(fetchCounter, 30000);
      return () => clearInterval(interval);
    }
  }, [playerId]);

  const initializePlayer = async () => {
    try {
      let storedPlayerId = await getStorageItem('pokemon_player_id');
      let storedPlayerCount = await getStorageItem('pokemon_player_count');
      
      if (!storedPlayerId) {
        storedPlayerId = generatePlayerId();
        await setStorageItem('pokemon_player_id', storedPlayerId);
        await setStorageItem('pokemon_player_count', '0');
        storedPlayerCount = '0';
      }
      
      setPlayerId(storedPlayerId);
      setPlayerCount(parseInt(storedPlayerCount || '0'));
    } catch (error) {
      console.error('Error initializing player:', error);
      // Fallback for errors
      const fallbackId = generatePlayerId();
      setPlayerId(fallbackId);
      setPlayerCount(0);
    }
  };

  const fetchCounter = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/counter/player/${playerId}`);
      if (!response.ok) throw new Error('Failed to fetch counter');
      
      const data = await response.json();
      setGlobalCount(data.count);
      setPlayerCount(data.playerCount);
      setLastUpdated(data.lastUpdated);
      setError('');
      
      // Update local storage with server data
      await setStorageItem('pokemon_player_count', data.playerCount.toString());
    } catch (error) {
      console.error('Failed to fetch counter:', error);
      setError('Failed to load counter. Using offline mode.');
    }
  };

  const incrementCounter = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/counter/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      
      if (!response.ok) throw new Error('Failed to increment counter');
      
      const data = await response.json();
      setGlobalCount(data.count);
      setPlayerCount(data.playerCount);
      setLastUpdated(data.lastUpdated);
      
      // Update local storage only on successful API call
      await setStorageItem('pokemon_player_count', data.playerCount.toString());
    } catch (error) {
      console.error('Failed to increment counter:', error);
      setError('Failed to update counter. Please visit the About & Contact page to report this issue so it can be fixed.');
      
      // Do NOT increment locally if API fails - this prevents the weird state issues
      // The counts will remain unchanged until the server issue is resolved
    }
    
    setLoading(false);
  };

  const localStyles = StyleSheet.create({
    title: {
      fontSize: RFPercentage(3),
      fontWeight: 'bold',
      marginBottom: RFPercentage(1.5),
      textAlign: 'center',
    },
    description: {
      fontSize: RFPercentage(1.5),
      textAlign: 'center',
      marginHorizontal: RFPercentage(2.5),
      width: '70%',
      alignSelf: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: RFPercentage(1.5),
    },
    counterContainer: {
      backgroundColor: '#f5f5f5',
      paddingVertical: RFPercentage(1.5),
      paddingHorizontal: RFPercentage(2.5),
      marginVertical: RFPercentage(0.6),
      marginHorizontal: RFPercentage(2.5),
      borderRadius: RFPercentage(1),
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    counter: {
      fontSize: RFPercentage(3),
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#4CAF50',
      margin: 0,
    },
    playerCounter: {
      fontSize: RFPercentage(2.5),
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#2196F3',
      margin: 0,
    },
    playerId: {
      fontSize: RFPercentage(1.5),
      color: '#888',
      textAlign: 'center',
      marginBottom: RFPercentage(0.6),
      fontFamily: 'monospace',
    },
    disclaimer: {
      fontSize: RFPercentage(1.3),
      textAlign: 'center',
      marginHorizontal: RFPercentage(2.5),
      width: '80%',
      alignSelf: 'center',
      lineHeight: RFPercentage(2),
    },
    error: {
      fontSize: RFPercentage(1.8),
      color: '#f44336',
      textAlign: 'center',
      marginVertical: RFPercentage(1.2),
    },
    lastUpdated: {
      fontSize: RFPercentage(1.5),
      color: '#666',
      textAlign: 'center',
      marginBottom: RFPercentage(1.2),
    },
    button: {
      backgroundColor: (Colors as any)[colorScheme ?? 'light'].accent,
      padding: RFPercentage(1.5),
      borderRadius: RFPercentage(1),
      margin: RFPercentage(1.5),
      width: RFPercentage(25),
      alignSelf: 'center',
    },
    congratsBanner: {
      marginVertical: RFPercentage(2),
      marginHorizontal: RFPercentage(2.5),
      padding: RFPercentage(2),
      borderRadius: RFPercentage(1.5),
      borderWidth: 2,
      alignItems: 'center',
    },
    milestoneReachedBanner: {
      backgroundColor: '#E8F5E8',
      borderColor: '#4CAF50',
    },
    maxRewardsBanner: {
      backgroundColor: '#FFF3E0',
      borderColor: '#FF9800',
    },
    congratsTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#2E7D32',
      marginBottom: RFPercentage(1),
    },
    congratsText: {
      fontSize: RFPercentage(1.6),
      textAlign: 'center',
      color: '#1B5E20',
      marginBottom: RFPercentage(0.8),
      lineHeight: RFPercentage(2.2),
    },
    congratsSubtext: {
      fontSize: RFPercentage(1.3),
      textAlign: 'center',
      color: '#388E3C',
      fontStyle: 'italic',
      lineHeight: RFPercentage(1.8),
    },
  });

  return (
    <View style={styles.page}>
      <GameBackgroundGradient></GameBackgroundGradient>
      <TitleOfPage titleA="Pokemon" titleB="Center
      "></TitleOfPage>
      <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollCards}
          >
          <View style={styles.content}>
            
            {/* Congratulatory Banner */}
            {globalCount >= 1000000 && (
              <View style={[
                localStyles.congratsBanner, 
                globalCount >= 2000000 ? localStyles.maxRewardsBanner : localStyles.milestoneReachedBanner
              ]}>
                <Text style={[
                  localStyles.congratsTitle,
                  globalCount >= 2000000 && { color: '#E65100' }
                ]}>
                  🎉 {globalCount >= 2000000 ? 'MAXIMUM REWARDS UNLOCKED!' : 'MILESTONE REACHED!'} 🎉
                </Text>
                <Text style={[
                  localStyles.congratsText,
                  globalCount >= 2000000 && { color: '#BF360C' }
                ]}>
                  {globalCount >= 2000000 
                    ? `Incredible! We've defeated Shiny Wo-Chien ${globalCount.toLocaleString()} times! All bonus rewards have been unlocked - the community has achieved the maximum possible rewards!`
                    : `Amazing! We've surpassed 1 million defeats! Keep going to unlock even more bonus rewards!`
                  }
                </Text>
                <Text style={[
                  localStyles.congratsSubtext,
                  globalCount >= 2000000 && { color: '#FF6F00' }
                ]}>
                  {globalCount >= 2000000 
                    ? 'Don\'t forget to claim your Shiny Wo-Chien from Mystery Gift between August 7-September 30, 2025!'
                    : 'Remember to stay connected online and check Poké Portal News for official updates!'
                  }
                </Text>
              </View>
            )}
            
            {/* Only show title if banner is not displayed */}
            {globalCount < 1000000 && (
              <Text style={localStyles.title}>{title}</Text>
            )}
            
            {error && (
              <Text style={[localStyles.error]}>{error}</Text>
            )}
            
            <View style={localStyles.buttonContainer}>
              <Pressable
                style={[localStyles.button, loading && { opacity: 0.6 }]}
                onPress={incrementCounter}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Updating...' : 'Defeated Shiny Wo-Chien'}
                </Text>
              </Pressable>
              <Text style={localStyles.description}>{description}</Text>
            </View>
            
            <View style={localStyles.counterContainer}>
              <Text style={localStyles.counter}>
                Global Count: {globalCount.toLocaleString()}
              </Text>
              <Text style={localStyles.playerCounter}>
                Your Contributions: {playerCount.toLocaleString()}
              </Text>
            {playerId && (
              <Text style={localStyles.playerId}>
                Player ID: {playerId.slice(-8)}
              </Text>
            )}
            </View>
            
            
            {lastUpdated && (
              <Text style={localStyles.lastUpdated}>
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </Text>
            )}
            
            <Text style={localStyles.disclaimer}>{disclaimer}</Text>
            <PokemonButtonCredit />
          </View>
          <Foot></Foot>
        </ScrollView>
    </View>
  );
}