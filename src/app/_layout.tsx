import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Uniwind } from 'uniwind';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

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
const ROOT_BACKGROUND_COLOR = '#20182D';
const WEB_READY_FALLBACK_MS = 3000;

const styles = StyleSheet.create({
  webViewport: {
    height: '100vh' as any,
    minHeight: '100vh' as any,
    width: '100%',
  },
});

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
    <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function LoadingOverlay() {
  return (
    <View
      // Use fixed positioning on web so it covers the viewport even if the root
      // container hasn't measured yet.
      style={{
        backgroundColor: ROOT_BACKGROUND_COLOR,
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      <StartupLoading message="Getting things ready for you..." />
    </View>
  );
}

function RootLayoutWebSSR() {
  return (
    <View className="flex-1 bg-themed" style={styles.webViewport}>
      <LoadingOverlay />
    </View>
  );
}

function RootLayoutClient() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    const neutralizeNavigationSceneBackground = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (!isDark) return;

      document
        .querySelectorAll<HTMLElement>('div[style*="background-color: rgb(242, 242, 242)"]')
        .forEach((element) => {
          const rect = element.getBoundingClientRect();
          const isFullScreenScene =
            rect.width >= window.innerWidth * 0.75 &&
            rect.height >= window.innerHeight * 0.75;

          if (isFullScreenScene) {
            element.style.backgroundColor = 'transparent';
          }
        });
    };

    neutralizeNavigationSceneBackground();
    const frame = window.requestAnimationFrame(neutralizeNavigationSceneBackground);
    const observer = new MutationObserver(neutralizeNavigationSceneBackground);
    observer.observe(document.getElementById('root') ?? document.body, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    if ((window as any).__DJS_BUILD_LOGGED__) return;

    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (process.env.NODE_ENV !== 'production' && isLocalHost) {
      (window as any).__DJS_BUILD_LOGGED__ = true;
      return;
    }

    (async () => {
      const metadataPaths = ['/__djsportfolio_build.json', '/dist/client/__djsportfolio_build.json'];
      let lastErrorMessage = 'metadata not found';

      for (const metadataPath of metadataPaths) {
        const buildMetadataUrl = `${metadataPath}?ts=${Date.now()}`;

        try {
          const response = await fetch(buildMetadataUrl, { cache: 'no-store' });
          if (!response.ok) {
            throw new Error(`${metadataPath} HTTP ${response.status}`);
          }

          const info = await response.json();
          const buildNumber = info?.buildNumber ?? 'unknown';
          const shortSha = info?.shortSha ?? 'unknown';
          const branch = info?.branch ?? 'unknown';
          const builtAt = info?.builtAt ?? 'unknown';

          console.info(
            `[DJsPortfolio] Build #${String(buildNumber)} | ${String(shortSha)} | ${String(branch)} | ${String(builtAt)} | ${metadataPath}`
          );
          return;
        } catch (error) {
          lastErrorMessage = error instanceof Error ? error.message : String(error);
        }
      }

      console.warn(`[DJsPortfolio] Build metadata unavailable: ${lastErrorMessage}`);
    })().finally(() => {
      (window as any).__DJS_BUILD_LOGGED__ = true;
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => {
        if (!('caches' in window)) return undefined;

        return window.caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith('djsportfolio-'))
                .map((key) => window.caches.delete(key))
            )
          );
      })
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
      let cancelled = false;
      const readyTimeout = window.setTimeout(() => {
        if (!cancelled) {
          setAppIsReady(true);
        }
      }, WEB_READY_FALLBACK_MS);

      const fontsReady = (document as any).fonts?.ready;
      if (!fontsReady) {
        window.clearTimeout(readyTimeout);
        setAppIsReady(true);
        return () => {
          cancelled = true;
        };
      }

      fontsReady
        .then(() => {
          if (!cancelled) {
            window.clearTimeout(readyTimeout);
            setAppIsReady(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            window.clearTimeout(readyTimeout);
            setAppIsReady(true);
          }
        });

      return () => {
        cancelled = true;
        window.clearTimeout(readyTimeout);
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
    // Web: keep the server and first client render identical, then mount routes
    // after fonts/theme are ready. This avoids mobile-width Expo Router
    // navigator hydration mismatches.
    return (
      <View className="flex-1 bg-themed" style={styles.webViewport}>
        {appIsReady ? (
          <View className="flex-1 bg-themed" style={styles.webViewport}>
            <AppStack />
          </View>
        ) : null}
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
