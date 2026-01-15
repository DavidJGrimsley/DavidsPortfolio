import { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';

import cosmosAnimation from '../../assets/lottie/Cosmos.json';

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
  const isSSR = typeof window === 'undefined';
  const [reduceMotion, setReduceMotion] = useState(false);
  const [Lottie, setLottie] = useState<null | React.ComponentType<any>>(null);

  useEffect(() => {
    if (isSSR) return;

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;

    const update = () => setReduceMotion(!!mq.matches);
    update();

    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, [isSSR]);

  useEffect(() => {
    if (isSSR) return;
    if (reduceMotion) return;
    if (!showAnimation) return;

    let cancelled = false;
    import('lottie-react')
      .then((mod) => {
        if (cancelled) return;
        setLottie(() => (mod as any).default);
      })
      .catch(() => {
        // If Lottie fails to load, we still keep the loading screen up with text.
      });

    return () => {
      cancelled = true;
    };
  }, [isSSR, reduceMotion, showAnimation]);

  const animationData = useMemo(() => cosmosAnimation as unknown as object, []);

  return (
    <View className="flex-1 items-center justify-center bg-themed">
      {!isSSR && !reduceMotion && showAnimation && Lottie ? (
        <View className="w-[60%] max-w-120 aspect-square">
          <Lottie animationData={animationData} loop autoplay style={{ width: '100%', height: '100%' }} />
        </View>
      ) : (
        <View className="w-[60%] max-w-120 aspect-square items-center justify-center">
          {showAnimation ? <View className="w-[18%] aspect-square rounded-full bg-secondary opacity-40" /> : null}
        </View>
      )}
      {showMessage ? <Text className="text-themed mt-[2%] opacity-70">{message}</Text> : null}
    </View>
  );
}
