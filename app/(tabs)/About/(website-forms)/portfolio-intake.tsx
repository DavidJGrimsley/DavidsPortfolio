import React from "react";
import { IframeEmbed } from "@/components/CustomComponents";



export default function PortfolioIntake() {
  return (
    <>
      <IframeEmbed src="https://docs.google.com/forms/d/e/1FAIpQLSemBxe0Z6JYAZi8D9ZeMBU9HTRxqC-QlsSWoBTG6LvYKGDWsA/viewform?embedded=true"/>
    </>
  )
}








// THIS IS ALL FOR PARALLAX REFERENCE
// const { width } = Dimensions.get('window');
// const IMG_HEIGHT = 300;

// export default function Page() {
//   const { title } =useLocalSearchParams();
//   let titleString = title ? title.toString() : "";

//   // For parallax
//   const scrollRef = useAnimatedRef<Animated.ScrollView>();
//   const scrollOffset = useScrollViewOffset(scrollRef);

//   const imageAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [
//         {
//           translateY: interpolate(
//             scrollOffset.value,
//             [-IMG_HEIGHT, 0, IMG_HEIGHT],
//             [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * .5]
//           )
//         }
//       ]
//     }
//   })

  // This makes the affected scroll up faster than the scroll itself
  // translateY: interpolate(
  //   scrollOffset.value,
  //   [0, IMG_HEIGHT],
  //   [0, -IMG_HEIGHT]
  // )
  
  // return (
    // <View style={styles.page}>
   {/* Display the information in the JSON file that is associated with the URL 'id' at the end */}
    {/* // <UnderConstruction/>
    //   <GameDetails title={titleString} />      
    //   <Button title="Back" onPress={() => router.back()}/> */}
{/* parallax */}
{/* <View style={herestyles.container}>
  <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
      <Animated.Text style={[{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20 }, imageAnimatedStyle]}>
        Parallax Scroll ANIMATED
      </Animated.Text>
    <Animated.Image
      source={{
        uri: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302'
      }}
      style={[herestyles.image, imageAnimatedStyle]}
      />
    
    <View style={{ height: 2000, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20 }}>
        Parallax Scroll
      </Text>
      <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20 }}>
        Parallax Scroll
      </Text>
      <Animated.Text style={[{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20 }, imageAnimatedStyle]}>
        Parallax Scroll ANIMATED
      </Animated.Text>
      <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20 }}>
        Parallax Scroll
      </Text>
      <Animated.Image
      source={{
        uri: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302'
      }}
      style={[herestyles.image, imageAnimatedStyle]}
      />
      <Image
      source={{
        uri: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302'
      }}
      style={herestyles.image}
      />
    </View>
  </Animated.ScrollView>
</View>
</View>
  );
} */}



