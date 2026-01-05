import React from 'react';
import { View, Text, Dimensions, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import pieces from '../assets/json/pieces.json';
import { router, Href } from 'expo-router';
import YoutubePlayer from "react-native-youtube-iframe";
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';


// Define the interface for the data
interface Highlight {
    highlightTitle: string;
    highlightCaption?: string;
    highlightPictures?: string[];
    video?: string;
    description: string;
    code?: string;
}

interface OtherSection {
    category: string;
    title: string;
    caption: string;
}

interface Piece {
    title: string;
    displayTitle?: string;
    isFeatured: boolean;
    inProgress: boolean;
    caption: string;
    picture: string;
    gif: string;
    github?: string;
    breakdown: string;
    steam?: string;
    youtubeID?: string;
    site?: string;
    skillsUsed?: string[];
    skillsLearned?: string[];
    highlights?: Highlight[];
    otherSections?: OtherSection[];
}

interface Pieces {
    [key: string]: Piece[];
    "mobile-apps": Piece[];
    "game-design": Piece[];
    "website-development": Piece[];
    "software-development": Piece[];
}
// Preprocess pieces to ensure highlightPictures is always an array if present
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

const piecesData: Pieces = normalizePieces(pieces);

const screenWidth = Dimensions.get('window').width;


// Defining all of my reusable components here.

//Footer component
function Foot() {
    return (
        <View className="border-[0.2%] border-accent min-h-[5%] m-[1%] p-[1.5%] rounded-[0.5%] items-center justify-center w-[90%] max-w-150 self-center">
            <Text className="text-accent text-[1.4%] text-center">
                Contact me at: <a href="mailto:DavidJGrimsley@Gmail.com">DavidJGrimsley@Gmail.com</a>
            </Text >
            <Text className="text-accent text-[1.4%] text-center">Made by David 'Mr. DJ' Grimsley</Text>
        </View>
    );
}

//Title of the page component
const TitleOfPage = ({ titleA = 'Featured', titleB = 'Project' }) => {
    return (
        <View className="text-center pb-[1.2%] pt-[1.2%] px-[1%] -z-10">
            <Text className="relative uppercase text-[4%] font-bold font-[Rubik] text-themed">
                {titleA}
                <Text className="text-secondary"> {titleB}</Text>
                <Text style={{ position: 'absolute', top: '50%', left: '50%', color: 'var(--color-accent)', zIndex: -1, transform: 'translate(-50%, -50%)', fontWeight: '800', opacity: 0.5, fontSize: '6%' }}>
                    {titleA}
                    {titleB}
                </Text>
            </Text>
        </View>
    );
};

//Component to display bootstrap cards based on the page category
const MyCards = ({ pageCategory }: { pageCategory: string }) => {
    // Create a state variable to store the data
    const [data, setData] = React.useState<React.ReactElement<any, any>[]>([]);

    // Use the useEffect hook to run the looping
    React.useEffect(() => {
        // Create a new array to store the data temporarily
        const newData: React.ReactElement<any, any>[] = [];
        // Loop through the keys, or first layer, within the piecesData/JSON
        Object.keys(piecesData).forEach((category) => {
            // See if the key matches the pageCategory
            if (category === pageCategory) {
                // If it does, loop through the array of that category 
                piecesData[category].forEach((element: Piece) => {
                    // Create a bootstrap card for each element in the array
                    const card = (
                        <Col key={element.title} className="w-full items-center">
                            <Card className="m-[2%] w-[90%] max-w-200" style={{} as React.CSSProperties}>
                                <Card.Img variant="top" src={element.gif} />
                                <Card.Body>
                                    <Card.Title>{element.displayTitle || element.title}</Card.Title>
                                    <Card.Text>{element.caption}</Card.Text>
                                    {/* // Have the card button link to a new page with more information at app/(tabs)/MobileDev/[id].tsx where id is the "title" of the element */}
                                    
                                    <Button variant="primary" onClick={() => router.push(`/${pageCategory}/${element.title}` as Href<string>)}>
                                        View details
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                    // Add the card to the data array
                    newData.push(card);
                });
            }
        });
        // Set the data state variable to the new array
        setData(newData);
    }, [pageCategory]);
    
    // Return the data array
    return (
        <Container className="flex flex-wrap justify-center items-center">
            <Row className="items-center flex-row flex-wrap w-full">
                {data}
            </Row>
        </Container>
    );    
};

//export to be used in other files

// Display the featured card(s) on the home page
const FeaturedCard = () => {
    const [data, setData] = React.useState<React.ReactElement<any, any>[]>([]);
    
    React.useEffect(() => {
        const newData: React.ReactElement<any, any>[] = [];
                // Loop through the keys of the data
            Object.keys(piecesData).forEach((category) => {
                // Loop through the array of that category
                piecesData[category].forEach((element: Piece) => {
                    // Check if the element is featured
                    if (element.isFeatured) {
                        // Create the card based on bootstrap
                        const card = (
                            <Card key={element.title} style={{ width: screenWidth / 1.8 }}>
                                <Card.Img variant="top" src={element.gif} />
                                <Card.Body>
                                    <Card.Title>{element.displayTitle || element.title}</Card.Title>
                                    <Card.Text>{element.caption}</Card.Text>
                                    {/* // Have the card button link to a new page with more information at app/(tabs)/MobileDev/[id].tsx where id is the "title" of the element */}
                                    <Button variant="primary" onClick={() => router.push(`/${category}/${element.title}` as Href<`/${string}/${string}`>)}>
                                        View Details
                                    </Button>
                                </Card.Body>
                            </Card>
                        );
                        // Add the card to the data array
                        newData.push(card);
                    }
                });
            });
            // Set the data state variable to the new array
            setData(newData);
    }, [piecesData, screenWidth]);                            
    return <View>{data}</View>;
};


const HighlightImageCarousel = ({ pictures }: { pictures?: string[] }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const imageWidth = screenWidth * 0.9;
    const imageHeight = Math.min(screenHeight * 0.5, imageWidth * 1.2); // Use more height

    React.useEffect(() => {
        if (!pictures || !Array.isArray(pictures) || pictures.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % pictures.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [pictures]);

    if (!pictures || !Array.isArray(pictures) || pictures.length === 0) return null;

    return (
        <View style={{ width: '100%', alignItems: 'center', marginVertical: 4 }}>
            <Image 
                source={{ uri: pictures[currentIndex] }} 
                style={{ width: imageWidth, height: imageHeight, resizeMode: 'contain' }}
                contentFit="contain"
                transition={300}
            />
            {pictures.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                    {pictures.map((_, idx) => (
                        <View
                            key={idx}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 2,
                                backgroundColor: idx === currentIndex ? '#007bff' : '#ccc',
                                marginHorizontal: 4,
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const HighlightView = ({ highlights }: { highlights: Highlight[] }) => {
    return (
        <View>
            {highlights.map((highlight, index) => (
                <View key={index} className="flex items-center justify-center bg-tint/50 rounded-[0.5%] p-[1%] m-[1%] w-[95%] self-center">
                    <Text className="text-themed text-center text-[2.2%] font-bold">{highlight.highlightTitle}</Text>
                    <View className="flex items-center justify-center flex-row flex-wrap">
                        {highlight.highlightPictures && Array.isArray(highlight.highlightPictures) && highlight.highlightPictures.length > 0 && (
                            <HighlightImageCarousel pictures={highlight.highlightPictures} />
                        )}
                        {highlight.highlightCaption && (
                            <Text className="text-accent text-center p-[0.5%] text-[1.4%] bg-secondary/15">{highlight.highlightCaption}</Text>
                        )}
                    </View>
                    <Text className="text-themed text-center text-[1.6%] mb-[1%] px-[1%]">{highlight.description}</Text>
                    {highlight.video && (
                        <YoutubePlayer
                            height={Dimensions.get('window').width * 0.5 * 0.5625}
                            width={Dimensions.get('window').width * 0.5}
                            play={false}
                            videoId={highlight.video}
                        />
                    )}
                    {highlight.code && (
                        <View style={{ backgroundColor: '#f5f5f5', borderRadius: 5, padding: 10, marginVertical: 10, borderWidth: 1, borderColor: '#ddd', width: '90%', maxWidth: 800, alignSelf: 'center' }}>
                            <Text style={{ fontFamily: 'Courier New', fontSize: 13, color: '#333', lineHeight: 19 }}>{highlight.code}</Text>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};


const backgroundGradient = () => {
    return (
        <LinearGradient
        // Background Linear Gradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={{ position: 'absolute', zIndex: -5, left: 0, right: 0, top: 0, bottom: 0 }}
        />
    )
}

const UnderConstruction = () => {
    return (
        <View>
             <Text style={{ fontSize: 20 }}>
                This page is under construction. Thanks for visiting! Contact me for more information.
            </Text>
        </View>
    )
}

const InProgress = () => { 
    return (
        <View className="bg-accent p-[1%] rounded-[0.5%] m-[1%]">
            <Text className="text-secondary text-center text-[1.2%]">
                ⚠️ This portfolio piece is still in progress. I'm working around the clock to get my projects updated and continually polishing when I can. Check back regularly for updates! ⚠️
            </Text>
        </View>
    )
}

const IframeEmbed = ({ src }: { src: string }) => {
    const isWeb = Platform.OS === 'web';
    
    return isWeb ? (
        <iframe src={src} style={{ height: '85%' }} />
    ) : (
        <WebView
            source={{ uri: src }}
            style={{ height: '85%' }}
        />
    );
}

const HorizontalLinks = ({ github, site, steam }: { github?: string; site?: string; steam?: string }) => {
    return (
        <View className="flex-row justify-center items-center my-[10px]">
            {github && (
                <Pressable className="bg-accent p-[1%] rounded-[1%] m-[1%] w-[20%] self-center" onPress={() => window.open(github)}>
                    <Text className="text-secondary text-center text-[2%]">Github</Text>
                </Pressable>
            )}
            {site && (
                <Pressable className="bg-accent p-[1%] rounded-[1%] m-[1%] w-[20%] self-center" onPress={() => window.open(site)}>
                    <Text className="text-secondary text-center text-[2%]">Info Website</Text>
                </Pressable>
            )}
            {steam && (
                <Pressable className="bg-accent p-[1%] rounded-[1%] m-[1%] w-[20%] self-center" onPress={() => window.open(steam)}>
                    <Text className="text-secondary text-center text-[2%]">See it here!</Text>
                </Pressable>
            )}
        </View>
    );
};

const OtherSectionsLinks = ({ otherSections }: { otherSections?: OtherSection[] }) => {
    if (!otherSections || otherSections.length === 0) {
        return null;
    }

    const handlePress = (category: string, title: string) => {
        // Navigate to the other section's detail page
        const route = `/${category}/${encodeURIComponent(title)}` as Href;
        router.push(route);
    };

    return (
        <View style={{ marginVertical: 20, paddingVertical: 15, paddingHorizontal: 20, borderTopWidth: 2, borderTopColor: 'var(--color-tint)', alignItems: 'center' }}>
            <Text style={{ fontSize: '3%', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 10 }}>Related Projects:</Text>
            {otherSections.map((section, index) => (
                <Pressable 
                    key={index} 
                    style={{ backgroundColor: 'var(--color-tint)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginVertical: 5, width: '100%', maxWidth: 600, alignItems: 'center' }}
                    onPress={() => handlePress(section.category, section.title)}
                >
                    <Text style={{ color: 'var(--color-secondary)', fontSize: '2%', fontWeight: '600', textAlign: 'center' }}>
                        {section.caption} →
                    </Text>
                </Pressable>
            ))}
        </View>
    );
};

export { MyCards, Foot, TitleOfPage, FeaturedCard, Highlight, Piece, Pieces, UnderConstruction, IframeEmbed, HighlightView, InProgress, HorizontalLinks, OtherSectionsLinks, OtherSection };