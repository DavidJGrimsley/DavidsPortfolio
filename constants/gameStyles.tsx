import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

const scrollRef = useAnimatedRef<Animated.ScrollView>();
const scrollOffset = useScrollViewOffset(scrollRef);

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

export { scrollRef };