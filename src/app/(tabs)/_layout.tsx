import React from 'react';
import { type Href, router, Tabs, useSegments } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { PokemonButton } from '@/components/PokemonButton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RFPercentage } from 'react-native-responsive-fontsize';
import * as Device from 'expo-device';
import { Pressable, Text, View, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const TabLayout = ({  }) => {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  
  // Color values based on theme
  const tintColor = colorScheme === 'light' ? '#4B718A' : '#a96710';
  const tabIconDefault = colorScheme === 'light' ? '#723B80' : '#321e3bb9';
  const secondaryColor = colorScheme === 'light' ? '#afeef7' : '#a96710';
  const accentColor = colorScheme === 'light' ? '#723B80' : '#321e3bb9';
  const headerBg = colorScheme === 'light' ? '#F4F4F4' : '#040404';
  
  // Convert segments to regular array to avoid TypeScript tuple issues
  const routeSegments = [...segments];
  
  // Fix: More robust home page detection for both dev and production
  const isHomePage = routeSegments.length === 0 || 
                     (routeSegments.length === 1 && routeSegments[0] === '(tabs)') ||
                     routeSegments.join('/') === '(tabs)' ||
                     routeSegments.join('/') === '';
  
  // Fix: Check for main section pages (not including structural segments)
  const mainSections = ['mobile-apps', 'game-design', 'website-development', 'software-development', 'about', 'learn', 'pokemon', 'api', 'mcp'];
  
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

  // Always render Tabs navigation for consistency
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: tabIconDefault,
        tabBarAllowFontScaling: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: secondaryColor,
          borderTopColor: accentColor,
          height: RFPercentage(5),
        },
        tabBarActiveBackgroundColor: accentColor,
        tabBarLabelStyle: {
          fontSize: RFPercentage(1),
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShadowVisible: false,
          title: 'David \'DJ\' Grimsley',
          headerStyle: { backgroundColor: headerBg },
          headerTitleStyle: { color: secondaryColor },
          headerRight: () => (
            <Pressable
              onPress={() => router.replace('/(tabs)/pokemon' as Href)}
              style={{ marginRight: 15, padding: 5 }}
            >
              <PokemonButton size={RFPercentage(2.4)} />
            </Pressable>
          ),
          tabBarLabel: '',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mobile-apps"
        options={{
          headerShown: false,
          title: 'Mobile Apps',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'phone-portrait' : 'phone-portrait-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="game-design"
        options={{
          headerShown: false,
          title: 'Game Design',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'game-controller' : 'game-controller-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="website-development"
        options={{
          headerShown: false,
          title: 'Website Development',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'globe' : 'globe-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="software-development"
        options={{
          headerShown: false,
          title: 'Software Dev',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'server' : 'server-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          headerShown: false,
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'book' : 'book-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          headerShown: false,
          title: 'About & Contact',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="api"
        options={{
          headerShown: false,
          title: 'Public APIs',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'cloud' : 'cloud-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mcp"
        options={{
          headerShown: false,
          title: 'MCP',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'git-network' : 'git-network-outline'} color={color} />
          ),
        }}
      />
      {/* Pokemon screen is accessible via header button only, not in tab bar */}
      <Tabs.Screen
        name="pokemon"
        options={{
          headerShown: false,
          title: 'Pokemon',
          href: null, // This removes it from the tab bar
        }}
      />
    </Tabs>
  );
}

const NavButton = ({ title, route, icon, focusedIcon }: { title: string, route: string, icon: string, focusedIcon: string }) => {
  if (!route) return null;
  const newRoute = useRoute();
  const navigation = useNavigation();
  
  const isActive = (routeName: string) => routeName === newRoute.name;
  
  return (
    <Pressable className="side-nav" onPress={() => {
      router.dismissAll();
      router.replace(route as Href);
    }}>
      <Text className="side-nav-text">{title}</Text>
      <TabBarIcon name={isActive(route) ? icon as any : focusedIcon as any}  />
    </Pressable>
  );
}



export default TabLayout;
