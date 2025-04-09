import { Stack } from "expo-router";
import * as Device from 'expo-device';

const isMobileDevice = ((Device.deviceType === Device.DeviceType.PHONE) || (Device.deviceType === Device.DeviceType.TABLET));

export default function RootLayout() {
  return (  
    <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
    </Stack>
  )
}
