jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { ScrollView, Text, View } = require('react-native');

  const Animated = {
    ScrollView,
    Text,
    View,
    createAnimatedComponent: (Component) => Component,
  };

  const passthrough = (value) => value;

  return {
    __esModule: true,
    default: Animated,
    cancelAnimation: jest.fn(),
    Easing: {
      cubic: passthrough,
      linear: passthrough,
      out: passthrough,
      quad: passthrough,
    },
    Extrapolation: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity',
    },
    interpolate: (_value, _inputRange, outputRange) => outputRange[0],
    useAnimatedRef: () => React.useRef(null),
    useAnimatedStyle: (styleFactory) => styleFactory(),
    useScrollViewOffset: () => ({ value: 0 }),
    useSharedValue: (value) => ({ value }),
    withRepeat: passthrough,
    withSequence: (...values) => values[values.length - 1],
    withTiming: passthrough,
  };
});
