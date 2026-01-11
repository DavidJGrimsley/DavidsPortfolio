import { Stack } from "expo-router";
import * as Device from 'expo-device';
import { Uniwind } from 'uniwind';
import { useEffect } from 'react';
import '~/global.css';

const isMobileDevice = ((Device.deviceType === Device.DeviceType.PHONE) || (Device.deviceType === Device.DeviceType.TABLET));

export default function RootLayout() {
  useEffect(() => {
    // Follow the device/system theme automatically.
    Uniwind.setTheme('system');
  }, []);

  return (  
    <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
    </Stack>
  )
}
