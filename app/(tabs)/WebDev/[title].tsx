import { View, Text, Button, ScrollView, Image, Pressable, Alert, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { mobileStyles, MobileDetailsBackgroundGradient } from "@/constants/mobileStyles";
import { styles } from "@/constants/styles";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import React, { useCallback } from "react";
import pieces from '@/assets/json/pieces.json';
import { HighlightView, HorizontalLinks, InProgress, Piece, Pieces } from '@/components/CustomComponents'
import { FlashList } from "@shopify/flash-list";
import YoutubePlayer from "react-native-youtube-iframe";

const piecesData: Pieces = pieces;

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  let params: Record<string, string>[] = [];
  Object.keys(piecesData).forEach((category) => {
    if (category === "WebDev") {
    piecesData[category].forEach((element: Piece) => {
      params.push({ title: element.title });
    });}
  });
  // const directory = await fs.readdir(path.join(process.cwd(), './(tabs)/MobileApps', category));
  return params;
}

export default function Page() {
  const { title } =useLocalSearchParams();
  let titleString = title ? title.toString() : "";
  const [data, setData] = React.useState<React.ReactElement<any, any> | null>(null);
  const [playing, setPlaying] = React.useState(false);
  
  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
      Alert.alert("Video has ended");
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);
    
    React.useEffect(() => {
        let newData: React.ReactElement<any, any> | null = null;
        Object.keys(piecesData).forEach((category) => {
            piecesData[category].forEach((element: Piece) => {
                if (element.title === title) {
                    let pic: string = `${element.picture}`;
                    const page = (
                      <View>
                        <Text style={mobileStyles.title}>{element.title}</Text>
                        {/* Display the image associated with the path at element.picture */}
                        <Text style={mobileStyles.caption}>{element.caption}</Text>
                        <View style={mobileStyles.imageContainer}>
                          <Image source={{ uri: element.picture }} style={mobileStyles.image} resizeMode="contain" />
                        </View>
                        {element.inProgress && (<InProgress/>)} 
                        {/* Display the breakdown of the project */}
                        <Text style={mobileStyles.breakdown}>{element.breakdown}</Text>
                        {/* Display the video associated with the path at element.video */}
                        <View style={mobileStyles.YTView}>
                          {element.youtubeID && (<YoutubePlayer
                            height={Dimensions.get('window').width * 0.7 * 0.5625}
                            width={Dimensions.get('window').width * 0.7}
                            play={false}
                            
                            videoId={element.youtubeID}
                            onChangeState={onStateChange}
                          />
                          )}
                        </View>
                        {/* <Pressable onPress={togglePlaying}>{playing ? "pause" : "play"}</Pressable> */}
                        {/* Bullet points for the skills used: */}
                        <View style={mobileStyles.listView}>
                          
                            <FlashList
                              data={element.skillsUsed}
                              ListHeaderComponent={<Text style={mobileStyles.listHeader}>Skills Used:</Text>}
                              renderItem={({ item }) => <Text style={mobileStyles.skills}>{item}</Text>}
                              estimatedItemSize={20}
                              horizontal={false}
                              numColumns={3}
                              showsHorizontalScrollIndicator={false}
                            />
                          
                          {/* Bullet points for the skills learned: */}
                          
                          
                            <FlashList 
                              data={element.skillsLearned}
                              ListHeaderComponent={<Text style={mobileStyles.listHeader}>Skills Learned:</Text>}
                              renderItem={({ item }) => <Text style={mobileStyles.skills}>{item}</Text>}
                              estimatedItemSize={20}
                              horizontal={false}
                              numColumns={3}
                              showsHorizontalScrollIndicator={false}
                            />
                          
                        </View>
                        {element.github || element.site || element.steam ? (
                          <HorizontalLinks github={element.github} site={element.site} steam={element.steam} />
                        ) : null}                        
                        {/* Show highlights if they exist */}
                        {element.highlights && (<HighlightView highlights={element.highlights} />)}
                      </View>
                    );
                    newData = page;
                }
            });
        });
        setData(newData);
    }, [title]);
    return (
      <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={mobileStyles.scroll}>
        <View style={mobileStyles.scroll}>
          <MobileDetailsBackgroundGradient/>
          <View style={mobileStyles.page}>{data}</View>
        </View>
      </ScrollView>

    );
  
}

