import { View } from 'react-native';

import { LoadingComponent } from '@/components/UI/LoadingComponent';

type StartupLoadingProps = {
  message?: string;
  showAnimation?: boolean;
  showMessage?: boolean;
};

export default function StartupLoading({
  message = 'Getting things ready for you...',
  showAnimation = true,
  showMessage = true,
}: StartupLoadingProps) {
  return (
    <View className="flex-1 items-center justify-center bg-themed">
      {showAnimation ? <LoadingComponent label={showMessage ? message : undefined} /> : null}
    </View>
  );
}
