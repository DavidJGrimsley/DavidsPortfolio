import { Platform } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';

// RFPercentage reads the viewport during render and returns 0 during web SSR.
// vmax uses the same larger viewport dimension, on both the server and client.
export function responsiveFontSize(percent: number): number {
  return Platform.OS === 'web' ? `${percent}vmax` as unknown as number : RFPercentage(percent);
}
