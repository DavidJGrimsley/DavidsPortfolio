import { View, Text, Button, ScrollView, Image, Pressable, Alert, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { mobileStyles, MobileDetailsBackgroundGradient } from "@/constants/mobileStyles";
import { styles } from "@/constants/styles";
import React, { useCallback } from "react";
import rawPieces from '@/assets/json/pieces.json';
import { HighlightView, HorizontalLinks, InProgress, Piece, Pieces, OtherSectionsLinks } from '@/components/CustomComponents'
import { FlashList } from "@shopify/flash-list";
import YoutubePlayer from "react-native-youtube-iframe";

// Normalize pieces to ensure proper structure
function normalizePieces(raw: any): Pieces {
  const result: Pieces = { MobileApps: [], GameDesign: [], WebDev: [], SoftwareDevelopment: [] };
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
  piecesData.WebDev.forEach((element: Piece) => {
    params.push({ title: element.title });
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
        const element = piecesData.WebDev.find((piece) => piece.title === title);
        if (element) {
          const page = (
            <View>
              <Text style={mobileStyles.title}>{element.title}</Text>
              <Text style={mobileStyles.caption}>{element.caption}</Text>
              <View style={mobileStyles.imageContainer}>
                <Image source={{ uri: element.picture }} style={mobileStyles.image} resizeMode="contain" />
              </View>
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
              {element.highlights && (<HighlightView highlights={element.highlights} />)}
              {element.otherSections && (<OtherSectionsLinks otherSections={element.otherSections} />)}
            </View>
          );
          setData(page);
        } else {
          setData(null);
        }
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

