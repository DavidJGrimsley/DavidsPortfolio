import React from 'react';
import { type Href, router, Tabs, useSegments } from 'expo-router';
import { TabBarIcon } from '@/components/Navigation/TabBarIcon';
import { PokemonButton } from '@/components/PokemonButton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RFPercentage } from 'react-native-responsive-fontsize';
import * as Device from 'expo-device';
import { Platform, Pressable, Text, View, Dimensions, useWindowDimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { VerticalTabBar } from '@/components/Navigation/VerticalTabBar';

/**
 * @EXTRACT: Desktop breakpoint for showing vertical tab bar
 * When extracting to npm, this should be configurable via props
 */
const DESKTOP_BREAKPOINT = 1024;

const TabLayout = ({  }) => {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { width: windowWidth } = useWindowDimensions();
  
  // Platform and viewport detection
  // @EXTRACT: Consider making this a hook: useIsDesktopWeb()
  const isWeb = Platform.OS === 'web';
  const isDesktopWidth = windowWidth >= DESKTOP_BREAKPOINT;
  const isDesktopWeb = isWeb && isDesktopWidth;
  
  // Color values based on theme - using CSS variable values for JS contexts
  // These match the --color-* variables in global.css
  const tintColor = colorScheme === 'light' ? '#0E668B' : '#EEA444';
  const tabIconDefault = colorScheme === 'light' ? '#723B80' : '#321E3B';
  const secondaryColor = colorScheme === 'light' ? '#A2DDF6' : '#A96710';
  const accentColor = colorScheme === 'light' ? '#723B80' : '#321E3B';
  const headerBg = colorScheme === 'light' ? '#E9DDEE' : '#20182D';
  
  // Convert segments to regular array to avoid TypeScript tuple issues
  const routeSegments = [...segments];
  
  // Fix: More robust home page detection for both dev and production
  const isHomePage = routeSegments.length === 0 || 
                     (routeSegments.length === 1 && routeSegments[0] === '(tabs)') ||
                     routeSegments.join('/') === '(tabs)' ||
                     routeSegments.join('/') === '';
  
  // Fix: Check for main section pages (not including structural segments)
  const mainSections = ['mobile-apps', 'game-design', 'website-development', 'software-development', 'services', 'contact', 'pokemon', 'public-facing'];
  
  // More robust section detection
  let currentSection = null;
  for (const segment of routeSegments) {
    if (mainSections.includes(segment)) {
      currentSection = segment;
      break;
    }
  }
  
  const isMainLevel = currentSection !== null;
  
  // Fix: Better detection of piece/detail level (dynamic routes)
  const isPieceLevel = routeSegments.some(seg => seg.includes('[')) ||
                       routeSegments.some(seg => seg === '[title]');

  /**
   * Desktop Web Layout
   * Uses VerticalTabBar with constrained content width
   * Grid: 5% margin | 75% content | 5% gap | 10% tabbar | 5% margin
   * 
   * @EXTRACT: This pattern should be documented as the recommended usage
   */
  // if (isDesktopWeb) {
    return (
      <View className="flex-1 flex-row w-full">

        <View style={{ width: '75%', flex: 1 }}>
          <Tabs
            screenOptions={{
              // Hide the bottom tab bar on desktop - we use VerticalTabBar instead
              tabBarStyle: { display: 'none' },
              headerShown: false,
            }}
          >
            <Tabs.Screen 
              name="index" 
              options={{ headerShown: false }} />
            <Tabs.Screen name="portfolio" />
            <Tabs.Screen name="public-facing" />
            <Tabs.Screen name="pokemon" options={{ href: null }} />
          </Tabs>
        </View>

          <VerticalTabBar />
        
      </View>
    );
  }

  /**
   * Mobile/Tablet Layout (Native + Mobile Web)
   * Uses standard bottom Tabs navigation
   * 
   * @EXTRACT: This is the fallback for non-desktop platforms
   * Consider: MobileWebTabBar variant for tablet-sized web browsers
   */
  // return (
  //   <Tabs
  //     screenOptions={{
  //       tabBarActiveTintColor: tintColor,
  //       tabBarInactiveTintColor: tabIconDefault,
  //       tabBarAllowFontScaling: true,
  //       tabBarLabelPosition: 'below-icon',
  //       tabBarStyle: {
  //         backgroundColor: secondaryColor,
  //         borderTopColor: accentColor,
  //         height: RFPercentage(5),
  //       },
  //       tabBarActiveBackgroundColor: accentColor,
  //       tabBarLabelStyle: {
  //         fontSize: RFPercentage(1),
  //       }
  //     }}
  //   >
  //     <Tabs.Screen
  //       name="index"
  //       options={{
  //         headerShadowVisible: false,
  //         title: 'David \'DJ\' Grimsley',
  //         headerStyle: { backgroundColor: headerBg },
  //         headerTitleStyle: { color: secondaryColor },
  //         headerRight: () => (
  //           <Pressable
  //             onPress={() => router.replace('/(tabs)/pokemon' as Href)}
  //             style={{ marginRight: 15, padding: 5 }}
  //           >
  //             <PokemonButton size={RFPercentage(2.4)} />
  //           </Pressable>
  //         ),
  //         tabBarLabel: '',
  //         tabBarIcon: ({ color, focused }) => (
  //           <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
  //         ),
  //       }}
  //     />
  //     <Tabs.Screen
  //       name="portfolio"
  //       options={{
  //         headerShown: false,
  //         title: 'Portfolio',
  //         tabBarIcon: ({ color, focused }) => (
  //           <TabBarIcon name={focused ? 'briefcase' : 'briefcase-outline'} color={color} />
  //         ),
  //       }}
  //     />
  //     <Tabs.Screen
  //       name="public-facing"
  //       options={{
  //         headerShown: false,
  //         title: 'Public',
  //         tabBarIcon: ({ color, focused }) => (
  //           <TabBarIcon name={focused ? 'cloud' : 'cloud-outline'} color={color} />
  //         ),
  //       }}
  //     />
  //     <Tabs.Screen
  //       name="more"
  //       options={{
  //         headerShown: false,
  //         title: 'More',
  //         tabBarIcon: ({ color, focused }) => (
  //           <TabBarIcon name={focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline'} color={color} />
  //         ),
  //       }}
  //     />
  //     {/* Pokemon screen is accessible via header button only, not in tab bar */}
  //     <Tabs.Screen
  //       name="pokemon"
  //       options={{
  //         headerShown: false,
  //         title: 'Pokemon',
  //         href: null, // This removes it from the tab bar
  //       }}
  //     />
  //   </Tabs>
  // );
// }

export default TabLayout;
