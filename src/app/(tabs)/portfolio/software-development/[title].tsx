import { View, Text, Button, ScrollView, Image, Pressable, Alert, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { BackgroundGradient } from "@/components/Gradients";
import React, { useCallback, useState } from "react";
import rawPieces from '@json/pieces.json';
import { InProgress } from '@/components/Categories/InProgress';
import { HighlightView } from '@/components/Categories/HighlightView';
import { HorizontalLinks } from '@/components/Categories/HorizontalLinks';
import { OtherSectionsLinks } from '@/components/Categories/OtherSectionsLinks';
import { Piece, Pieces } from '@/types/portfolio';
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
              <Text className="text-[4%] md:text-[5%] text-left font-bold text-tint ml-[2%]">{element.displayTitle || element.title}</Text>
              <Text className="text-[2%] text-right text-themed mr-[2%] ml-[2%] opacity-85">{element.caption}</Text>
              <View className="flex-row justify-center items-center mx-[2%] my-[2%] w-full self-center h-[40%]">
                <Image source={{ uri: element.picture }} className="w-full h-full" resizeMode="contain" />
              </View>
              {(element.displayTitle || element.title).includes('Quantum') && (
                <View className="my-3">
                  <HelloWave />
                </View>
              )}
              {element.inProgress && (<InProgress/>)} 
              <Text className="text-[2.2%] text-left text-themed mb-[1%]">{element.breakdown}</Text>
              <View className="justify-center items-center my-[2%]">
                {element.youtubeID && (<YoutubePlayer
                  height={Dimensions.get('window').width * 0.7 * 0.5625}
                  width={Dimensions.get('window').width * 0.7}
                  play={false}
                  videoId={element.youtubeID}
                  onChangeState={onStateChange}
                />)}
              </View>
              <View className="bg-secondary h-px w-full my-5" />
              {element.highlights && (<HighlightView highlights={element.highlights}/>)}
              <View className="bg-secondary h-px w-full my-5" />
              {element.skillsUsed && (
                  <>
                  <Text className="text-[3%] text-left font-bold text-tint mt-[2%] mb-[1%]">Skills Used</Text>
                  <FlashList
                      data={element.skillsUsed}
                      numColumns={2}
                      renderItem={({ item }: { item: string }) => (
                      <Text className="text-left text-[1.8%] text-themed p-[1%] mx-[0.5%] my-[0.5%] rounded-[0.5%] border border-tint">{item}</Text>
                      )}
                      keyExtractor={(item, index) => `${item}-${index}`}
                  />
                  </>
              )}
              {element.skillsLearned && (
                  <>
                  <Text className="text-[3%] text-left font-bold text-tint mt-[2%] mb-[1%]">Skills Learned</Text>
                  <FlashList
                      data={element.skillsLearned}
                      numColumns={2}
                      renderItem={({ item }: { item: string }) => (
                      <Text className="text-left text-[1.8%] text-themed p-[1%] mx-[0.5%] my-[0.5%] rounded-[0.5%] border border-accent">{item}</Text>
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

    }, [title]);


  return (
    <ScrollView 
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="bg-themed"
      onScroll={handleScroll}
      scrollEventThrottle={20}
    >
      <View className="bg-themed">
        <BackgroundGradient />
        <View className="flex-1 mx-[2%] my-[3%] w-[95%] max-w-300 self-center justify-around">{data}</View>
      </View>
    </ScrollView>

  );
}

