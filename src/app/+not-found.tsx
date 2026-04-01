import React, { useEffect, useState } from 'react';
import { Link, Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import LottieView from 'lottie-react-native';

import { ThemedText } from '@/components/UI/ThemedText';
import { TabContainer } from '@/components/navigation/TabContainer';

type LottieComponent = React.ComponentType<any> | null;

export default function NotFoundScreen() {
  const isSSR = typeof window === 'undefined';
  const [WebLottie, setWebLottie] = useState<LottieComponent>(null);

  useEffect(() => {
    if (isSSR || Platform.OS !== 'web') return;
    let cancelled = false;
    import('lottie-react')
      .then((mod) => {
        if (cancelled) return;
        setWebLottie(() => (mod as any).default);
      })
      .catch(() => {
        // no-op
      });
    return () => {
      cancelled = true;
    };
  }, [isSSR]);


  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TabContainer
        titleA="Page"
        titleB="Not Found"
        leadBody="Sorry, this screen doesn't exist. This shouldn't have happened. I'm embarrassed."
      >
        <View className="w-full items-center">
          <View className="w-[70%] max-w-120 aspect-square">
            {Platform.OS === 'web' ? (
              WebLottie ? (
                <WebLottie animationData={require('../../assets/lottie/404_error.json')} loop autoplay style={{ width: '100%', height: '100%' }} />
              ) : (
                <View className="w-full h-full bg-secondary/20 rounded-2xl" />
              )
            ) : (
              <LottieView
                
                source={require('../../assets/lottie/404_error.json')}
                autoPlay
                loop
                enableMergePathsAndroidForKitKatAndAbove
                resizeMode="contain"
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>
          <Link href="/" className="mt-6 py-3">
            <ThemedText type="link">Go to home screen!</ThemedText>
          </Link>
        </View>
      </TabContainer>
    </>
  );
}
