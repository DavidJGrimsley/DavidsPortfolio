import { StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated';

// Dynamic dimension getters to prevent refresh issues
const getDimensions = () => Dimensions.get('window');
const getImageHeight = () => {
  const { width, height } = getDimensions();
  const isSmall = width < 768;
  const isMedium = width >= 768 && width < 1024;
  return isSmall ? Math.min(height * 0.3, 250) : isMedium ? 300 : 350;
};

const { width } = getDimensions();
const IMG_HEIGHT = getImageHeight();

// Note: These hooks need to be called inside components, not at module level
// Components using these should call useAnimatedRef and useScrollViewOffset directly

// This makes the affected scroll up faster than the scroll itself
  // translateY: interpolate(
  //   scrollOffset.value,
  //   [0, IMG_HEIGHT],
  //   [0, -IMG_HEIGHT]
  // )


export const gameStyles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	image: {
		width: width,
		height: IMG_HEIGHT
	}
});

export const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-IMG_HEIGHT, 0, IMG_HEIGHT],
            [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * .5]
          )
        }
      ]
    }
  })

// Note: scrollRef and scrollOffset should be created in components using:
// const scrollRef = useAnimatedRef<Animated.ScrollView>();
// const scrollOffset = useScrollViewOffset(scrollRef);