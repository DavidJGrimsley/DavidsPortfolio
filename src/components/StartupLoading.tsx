import { View, Text, Platform } from 'react-native';
import LottieView from 'lottie-react-native';

type StartupLoadingProps = {
  message?: string;
};

export default function StartupLoading({ message = 'Loading…' }: StartupLoadingProps) {
  return (
    <View className="flex-1 items-center justify-center bg-themed">
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
      {Platform.OS !== 'web' ? (
        <Text className="text-themed mt-[2%] opacity-70">{message}</Text>
      ) : null}
    </View>
  );
}
