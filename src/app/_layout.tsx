import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Uniwind } from 'uniwind';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { CinzelDecorative_700Bold } from '@expo-google-fonts/cinzel-decorative';
import { EmblemaOne_400Regular } from '@expo-google-fonts/emblema-one';
import { LondrinaShadow_400Regular } from '@expo-google-fonts/londrina-shadow';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { NotoSansDisplay_400Regular } from '@expo-google-fonts/noto-sans-display';
import { NotoSansMono_400Regular } from '@expo-google-fonts/noto-sans-mono';
import { NotoSerif_400Regular } from '@expo-google-fonts/noto-serif';
import { NotoSerifDisplay_400Regular } from '@expo-google-fonts/noto-serif-display';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';

import StartupLoading from '@/components/StartupLoading';
import '~/global.css';

const isTestEnv = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

// Web client: apply theme ASAP (before first render) to reduce light→dark snapping.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    Uniwind.setTheme('system');
  } catch {
    // no-op
  }
}

function AppStack() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function LoadingOverlay() {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      // Use fixed positioning on web so it covers the viewport even if the root
      // container hasn't measured yet.
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999 }}
    >
      <StartupLoading message="Loading…" showAnimation={showAnimation} showMessage={showAnimation} />
    </View>
  );
}

function RootLayoutWebSSR() {
  return (
    <View className="flex-1">
      {/* Render the real app for SEO, but keep it visually hidden to prevent FOUT. */}
      <View className="flex-1" style={{ opacity: 0 }}>
        <AppStack />
      </View>
      <LoadingOverlay />
    </View>
  );
}

function RootLayoutClient() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        // no-op
      });
  }, []);

  // Native only: keep the OS splash visible until we explicitly hide it.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    SplashScreen.preventAutoHideAsync().catch(() => {
      // no-op
    });
  }, []);

  // Load fonts before revealing UI (native + web). This also preloads Ionicons.
  const [fontsLoaded] = useFonts({
    Rubik: require('../../assets/fonts/Rubik-VariableFont_wght.ttf'),
    'Rubik-Italic': require('../../assets/fonts/Rubik-Italic-VariableFont_wght.ttf'),
    Lora: require('../../assets/fonts/Lora-VariableFont_wght.ttf'),
    'Lora-Italic': require('../../assets/fonts/Lora-Italic-VariableFont_wght.ttf'),
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    // App typography fonts (web loads via Google Fonts; native loads locally here).
    'Noto Sans': NotoSans_400Regular,
    'Noto Sans Display': NotoSansDisplay_400Regular,
    'Noto Sans Mono': NotoSansMono_400Regular,
    'Noto Serif': NotoSerif_400Regular,
    'Noto Serif Display': NotoSerifDisplay_400Regular,
    'Londrina Shadow': LondrinaShadow_400Regular,
    'Cinzel Decorative-Bold': CinzelDecorative_700Bold,
    'Playfair Display-Bold': PlayfairDisplay_700Bold,
    'Emblema One': EmblemaOne_400Regular,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    // Apply theme before revealing the app UI.
    Uniwind.setTheme('system');

    if (Platform.OS === 'web') {
      const timeout = window.setTimeout(() => setAppIsReady(true), 2500);
      (document as any).fonts
        ?.ready
        .then(() => {
          window.clearTimeout(timeout);
          setAppIsReady(true);
        })
        .catch(() => {
          window.clearTimeout(timeout);
          setAppIsReady(true);
        });

      return () => {
        window.clearTimeout(timeout);
      };
    }

    setAppIsReady(true);
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(() => {
    if (!appIsReady) return;
    if (Platform.OS === 'web') return;
    SplashScreen.hideAsync().catch(() => {
      // no-op
    });
  }, [appIsReady]);

  if (Platform.OS === 'web') {
    // Web: always render the real content (SEO/hydration), but cover it until ready.
    return (
      <View className="flex-1">
        <View className="flex-1" style={{ opacity: appIsReady ? 1 : 0 }}>
          <AppStack />
        </View>
        {!appIsReady ? <LoadingOverlay /> : null}
      </View>
    );
  }

  // Native: keep OS splash visible until ready.
  if (!appIsReady) return null;

  return (
    <View className="flex-1" onLayout={onLayoutRootView}>
      <AppStack />
    </View>
  );
}

export default function RootLayout() {
  if (isTestEnv) return <AppStack />;
  if (Platform.OS === 'web' && typeof window === 'undefined') return <RootLayoutWebSSR />;
  return <RootLayoutClient />;
}
