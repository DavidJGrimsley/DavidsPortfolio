import { View, Text, Button, ScrollView, Image, Pressable, Alert, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMobileStyles, MobileDetailsBackgroundGradient } from "@/constants/mobileStyles";
import { styles } from "@/constants/styles";
import React, { useCallback, useState } from "react";
import rawPieces from '@/assets/json/pieces.json';
import { InProgress, Piece, Pieces, HighlightView, HorizontalLinks, OtherSectionsLinks} from '@/components/CustomComponents'
import { HelloWave } from '@/components/QuantumAnimation';
import { FlashList } from "@shopify/flash-list";
import YoutubePlayer from "react-native-youtube-iframe";

// Normalize pieces to ensure proper structure
function normalizePieces(raw: any): Pieces {
    const result: Pieces = { "mobile-apps": [], "game-design": [], "website-development": [], "software-development": [] };
    Object.keys(result).forEach(category => {
        if (Array.isArray(raw[category])) {
            result[category] = raw[category].map((piece: any) => {
                if (Array.isArray(piece.highlights)) {
                    piece.highlights = piece.highlights.map((highlight: any) => {
                        if (highlight.highlightPictures && !Array.isArray(highlight.highlightPictures)) {
                            highlight.highlightPictures = [highlight.highlightPictures];
                        }
                        return highlight;
                    });
                }
                return piece;
            });
        }
    });
    return result;
}

const piecesData: Pieces = normalizePieces(rawPieces);


export async function generateStaticParams(): Promise<Record<string, string>[]> {
  let params: Record<string, string>[] = [];
  Object.keys(piecesData).forEach((category) => {
    if (category === "software-development") {
    piecesData[category].forEach((element: Piece) => {
      params.push({ title: element.title });
    });}
  });
  // const directory = await fs.readdir(path.join(process.cwd(), './(tabs)/software-development', category));
  return params;
}


export default function Page() {
  const { title } =useLocalSearchParams();
  const mobileStyles = useMobileStyles();
  const [data, setData] = React.useState<React.ReactElement<any, any> | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const screenHeight = Dimensions.get('window').height;
  
  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
      Alert.alert("Video has ended");
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);



  const handleScroll = (event: { nativeEvent: { contentOffset: { y: any; }; }; }) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setScrollY(yOffset);
    setNavVisible(yOffset < 50); // Hide nav bar if scrolled more than 50 pixels
    console.log('Scroll Y:', yOffset); // Debugging scroll position
  };
    
    React.useEffect(() => {
          console.log('[SoftwareDev detail] route param title:', title);
          const element = piecesData["software-development"].find((piece) => piece.title === title);
          console.log('[SoftwareDev detail] found element:', !!element, element?.displayTitle || element?.title);

          if (element) {
            const page = (
            <View> 
              <Text style={mobileStyles.title}>{element.displayTitle || element.title}</Text>
              <Text style={mobileStyles.caption}>{element.caption}</Text>
              <View style={mobileStyles.imageContainer}>
                <Image source={{ uri: element.picture }} style={mobileStyles.image} resizeMode="contain" />
              </View>
              {(element.displayTitle || element.title).includes('Quantum') && (
                <View style={{ marginVertical: 12 }}>
                  <HelloWave />
                </View>
              )}
              {element.inProgress && (<InProgress/>)} 
              <Text style={mobileStyles.breakdown}>{element.breakdown}</Text>
              <View style={mobileStyles.YTView}>
                {element.youtubeID && (<YoutubePlayer
                  height={Dimensions.get('window').width * 0.7 * 0.5625}
                  width={Dimensions.get('window').width * 0.7}
                  play={false}
                  videoId={element.youtubeID}
                  onChangeState={onStateChange}
                />)}
              </View>
              <View style={{backgroundColor: 'black', height: 1, width: '100%', marginVertical: 20}}></View>
              {element.highlights && (<HighlightView highlights={element.highlights}/>)}
              <View style={{backgroundColor: 'black', height: 1, width: '100%', marginVertical: 20}}></View>
              {element.skillsUsed && (
                  <>
                  <Text style={mobileStyles.subtitle}>Skills Used</Text>
                  <FlashList
                      estimatedItemSize={50}
                      data={element.skillsUsed}
                      numColumns={2}
                      renderItem={({ item }: { item: string }) => (
                      <Text style={mobileStyles.skillsUsed}>{item}</Text>
                      )}
                      keyExtractor={(item, index) => `${item}-${index}`}
                  />
                  </>
              )}
              {element.skillsLearned && (
                  <>
                  <Text style={mobileStyles.subtitle}>Skills Learned</Text>
                  <FlashList
                      estimatedItemSize={50}
                      data={element.skillsLearned}
                      numColumns={2}
                      renderItem={({ item }: { item: string }) => (
                      <Text style={mobileStyles.skillsLearned}>{item}</Text>
                      )}
                      keyExtractor={(item, index) => `${item}-${index}`}
                  />
                  </>
              )}
              <HorizontalLinks github={element.github} steam={element.steam} site={element.site}/>
              {element.otherSections && (<OtherSectionsLinks otherSections={element.otherSections} />)}
            </View>
          );
          setData(page);
        } else {
          console.log('[SoftwareDev detail] no element match; available titles:', piecesData["software-development"].map(p => p.title));
          setData(null);
        }

        return () => {};

    }, [title, mobileStyles]);


  return (
    <ScrollView 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={mobileStyles.scroll}
      onScroll={handleScroll}
      scrollEventThrottle={20}
    >
      <View style={mobileStyles.scroll}>
        <MobileDetailsBackgroundGradient/>
        <View style={mobileStyles.page}>{data}</View>
      </View>
    </ScrollView>

  );
}
