import React from 'react';
import { Href, router, Stack, Tabs, useSegments } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { styles } from '@/constants/styles';
import { RFPercentage } from 'react-native-responsive-fontsize';
import * as Device from 'expo-device';
import { Pressable, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const deviceType = Device.DeviceType;

const isMobileDevice = ((Device.deviceType === Device.DeviceType.PHONE) || (Device.deviceType === Device.DeviceType.TABLET));

const TabLayout = ({  }) => {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const isHomePage = segments[0] === '(tabs)'; // Check if it's the home page
  const isMainLevel = ['index', '(tabs)', 'MobileApps', 'GameDesign', 'WebDev', 'About'].includes(segments[1] ?? '');
  const isPieceLevel = segments[2] === '[title]';
  // Log the current route name.
  console.log(segments[0]);
  console.log(segments[1]);
  console.log(segments[2]);
  console.log(segments[3]);
  console.log(isHomePage);
  console.log(isMainLevel);
  console.log(isPieceLevel);

  return isMobileDevice ? (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarAllowFontScaling: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].secondary,
          borderTopColor: Colors[colorScheme ?? 'light'].accent,
          height: RFPercentage(5),
        },
        tabBarActiveBackgroundColor: Colors[colorScheme ?? 'light'].accent,
        tabBarLabelStyle: {
          fontSize: RFPercentage(1),
        }
        // headerShown: scrollY > screenHeight * 0.3,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShadowVisible: false,
          title: 'David \'DJ\' Grimsley',
          headerStyle: styles.headerBackground,
          // headerTransparent: true,
          tabBarLabel: '',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MobileApps"
        options={{
          headerShown: false,
          title: 'Mobile Apps',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="GameDesign"
        options={{
          headerShown: false,
          title: 'Game Design',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'game-controller' : 'game-controller-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="WebDev"
        options={{
          headerShown: false,
          title: 'Website Development',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'globe' : 'globe-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="About"
        options={{
          headerShown: false,
          title: 'About & Contact',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  ) : (
    <>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShadowVisible: false,
            title: 'David \'DJ\' Grimsley',
            headerStyle: styles.headerBackground,
          }}
        />
        <Stack.Screen name="MobileApps" options={{ headerShown: false }} />
        <Stack.Screen name="GameDesign" options={{ headerShown: false }} />
        <Stack.Screen name="WebDev" options={{ headerShown: false }} />
        <Stack.Screen name="About" options={{ headerShown: false }} />
      </Stack>
      {!isPieceLevel && (
        // Side navigation bar
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            height: '65vh',
            position: 'fixed',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '10px'
          }}
        >
          <NavButton title="Home" route="/(tabs)" icon="home" focusedIcon='home-outline'/>
          <NavButton title="Mobile Apps" route="/MobileApps" icon="code-slash" focusedIcon='code-slash-outline'/>
          <NavButton title="Game Design" route="/GameDesign" icon="game-controller" focusedIcon='game-controller-outline'/>
          <NavButton title="Website Development" route="/WebDev" icon="globe" focusedIcon='globe-outline'/>
          <NavButton title="About & Contact" route="/About" icon="person" focusedIcon='person-outline'/>
        </div>
       )}
    </>
  );
}

const NavButton = ({ title, route, icon, focusedIcon }: { title: string, route: string, icon: string, focusedIcon: string }) => {
  if (!route) return null;
  const newRoute = useRoute();
  const navigation = useNavigation();
  
  const isActive = (routeName: string) => routeName === newRoute.name;
  
  return (
    <Pressable style={styles.sideNav} onPress={() => router.replace(route as Href<string>)}>
      <Text style={styles.sideNavText}>{title}</Text>
      <TabBarIcon name={isActive(route) ? icon as any : focusedIcon as any}  />
    </Pressable>
  );
}



export default TabLayout;