import { LinearGradient } from 'expo-linear-gradient';

export const BackgroundGradient = () => {
  return (
    <LinearGradient
      colors={['hsl(var(--color-background))', 'hsl(var(--color-secondary))', 'transparent']}
      className="absolute inset-0 -z-5"
    />
  );
};

export const MobileBackgroundGradient = () => {
  return (
    <LinearGradient
      colors={['transparent', 'hsl(var(--color-background))', 'hsl(var(--color-secondary))', 'transparent']}
      className="absolute inset-0 -z-5"
    />
  );
};

export const GameBackgroundGradient = () => {
  return (
    <LinearGradient
      colors={['hsl(var(--color-secondary))', 'transparent', 'hsl(var(--color-background))', 'hsl(var(--color-secondary))']}
      className="absolute inset-0 -z-5"
    />
  );
};

export const WebBackgroundGradient = () => {
  return (
    <LinearGradient
      colors={['hsl(var(--color-background))', 'hsl(var(--color-secondary))', 'transparent', 'hsl(var(--color-background))']}
      className="absolute inset-0 -z-5"
    />
  );
};

export const AboutBackgroundGradient = () => {
  return (
    <LinearGradient
      colors={['transparent', 'hsl(var(--color-background))', 'hsl(var(--color-secondary))', 'transparent', 'hsl(var(--color-background))']}
      className="absolute inset-0 -z-5"
    />
  );
};

export const MobileDetailsBackgroundGradient = () => {
  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.8)', 'transparent']}
      className="absolute inset-0 -z-5"
    />
  );
};
