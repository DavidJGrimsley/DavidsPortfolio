import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { VerticalTabBar } from '@/components/navigation/VerticalTabBar';

const styles = StyleSheet.create({
  webViewport: {
    height: '100vh' as any,
    minHeight: '100vh' as any,
    width: '100%',
  },
});

/**
 * @EXTRACT: Desktop breakpoint for showing vertical tab bar
 * When extracting to npm, this should be configurable via props
 */
const TabLayout = () => {

  /**
   * Desktop Web Layout
   * Uses VerticalTabBar with constrained content width
   * Grid: 5% margin | 75% content | 5% gap | 10% tabbar | 5% margin
   * 
   * @EXTRACT: This pattern should be documented as the recommended usage
   */
  // if (isDesktopWeb) {
  const webViewportStyle = Platform.OS === 'web' ? styles.webViewport : null;

  return (
    <View className="flex-1 flex-row w-full" style={webViewportStyle}>
      <View style={[{ width: '75%', flex: 1 }, webViewportStyle]}>
        <Tabs
          screenOptions={{
            // Hide the bottom tab bar on desktop - we use VerticalTabBar instead
            tabBarStyle: { display: 'none' },
            headerShown: false,
            sceneStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{ headerShown: false }}
          />
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
