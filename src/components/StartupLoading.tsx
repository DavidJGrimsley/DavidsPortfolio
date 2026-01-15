import { View, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { ThemedText } from '@/components/UI/ThemedText';

type StartupLoadingProps = {
  message?: string;
  showAnimation?: boolean;
  showMessage?: boolean;
};

export default function StartupLoading({
  message = 'Loading…',
  showAnimation = true,
  showMessage = true,
}: StartupLoadingProps) {
  return (
    <View className="flex-1 items-center justify-center bg-themed">
      {showAnimation ? (
        <View className="w-[60%] max-w-120 aspect-square">
          <LottieView
            source={require('../../assets/lottie/Cosmos.json')}
            autoPlay
            loop
            // Native-only; web uses StartupLoading.web.tsx
            enableMergePathsAndroidForKitKatAndAbove
            resizeMode="contain"
          />
        </View>
      ) : (
        <View className="w-[60%] max-w-120 aspect-square" />
      )}
      {Platform.OS !== 'web' && showMessage ? (
        <ThemedText className="mt-[2%] opacity-70">{message}</ThemedText>
      ) : null}
    </View>
  );
}
