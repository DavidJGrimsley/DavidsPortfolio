import React from 'react';
import { View, Text, Image, Dimensions, Platform, Pressable } from 'react-native';
import { styles } from '../constants/styles';
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
    highlightPicture?: string;
    video?: string;
    description: string;
    code?: string;
}

interface Piece {
    title: string;
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
}
interface Pieces {
    [key: string]: Piece[];
    MobileApps: Piece[];
    GameDesign: Piece[];
    WebDev: Piece[];
}
const piecesData: Pieces = pieces;

const screenWidth = Dimensions.get('window').width;


// Defining all of my reusable components here.

//Footer component
function Foot() {
    return (
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                Contact me at: <a href="mailto:DavidJGrimsley@Gmail.com">DavidJGrimsley@Gmail.com</a>
            </Text >
            <Text style={styles.footerText}>Made by David 'Mr. DJ' Grimsley</Text>
        </View>
    );
}

//Title of the page component
const TitleOfPage = ({ titleA = 'Featured', titleB = 'Project' }) => {
    return (
        <View style={styles.mainTitle}>
            <Text style={styles.mainTitleText}>
                {titleA}
                <Text style={styles.mainTitleTextSpan}> {titleB}</Text>
                <Text style={styles.mainTitleTextBg}>
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
                        <Col key={element.title} style={styles.cardsCol as React.CSSProperties}>
                            <Card style={styles.card as React.CSSProperties}>
                                <Card.Img variant="top" src={element.picture} />
                                <Card.Body>
                                    <Card.Title>{element.title}</Card.Title>
                                    <Card.Text>{element.caption}</Card.Text>
                                    {/* // Have the card button link to a new page with more information at app/(tabs)/MobileDev/[id].tsx where id is the "title" of the element */}
                                    
                                    <Button variant="primary" onClick={() => router.push(`/${pageCategory}/${element.title}` as Href<string>)}>
                                        Learn More
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
        <Container style={styles.cardsContainer}>
            <Row style={styles.cardsRow}>
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
                                    <Card.Title>{element.title}</Card.Title>
                                    <Card.Text>{element.caption}</Card.Text>
                                    {/* // Have the card button link to a new page with more information at app/(tabs)/MobileDev/[id].tsx where id is the "title" of the element */}
                                    <Button variant="primary" onClick={() => router.push(`/${category}/${element.title}` as Href<`/${string}/${string}`>)}>
                                        Learn More
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


const HighlightView = ({ highlights }: { highlights: Highlight[] }) => {
    return (
        <View>
            {highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightView}>
                    <Text style={styles.highlightTitle}>{highlight.highlightTitle}</Text>
                    <View style={styles.highlightHeader}>
                        {highlight.highlightPicture && (
                            <Image source={{ uri: highlight.highlightPicture }} style={styles.highlightPicture} />
                        )}
                        {highlight.highlightCaption && (
                            <Text style={styles.highlightCaption}>{highlight.highlightCaption}</Text>
                        )}
                    </View>
                    <Text style={styles.highlightDescription}>{highlight.description}</Text>
                    {highlight.video && (
                        <YoutubePlayer
                            height={Dimensions.get('window').width * 0.5 * 0.5625}
                            width={Dimensions.get('window').width * 0.5}
                            play={false}
                            videoId={highlight.video}
                        />
                    )}
                    {highlight.code && (
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeText}>{highlight.code}</Text>
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
        style={styles.background}
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
        <View style={styles.inProgress}>
            <Text style={styles.inProgressText}>
                ⚠️ This portfolio piece is still in progress. I'm working around the clock to get my projects updated and continually polishing when I can. Check back regularly for updates! ⚠️
            </Text>
        </View>
    )
}

const IframeEmbed = ({ src }: { src: string }) => {
    const isWeb = Platform.OS === 'web';
    
    return isWeb ? (
        <iframe src={src} style={styles.webview} />
    ) : (
        <WebView
            source={{ uri: src }}
            style={styles.webview}
        />
    );
}

const HorizontalLinks = ({ github, site, steam }: { github?: string; site?: string; steam?: string }) => {
    return (
        <View style={styles.horizontalLinksContainer}>
            {github && (
                <Pressable style={styles.button} onPress={() => window.open(github)}>
                    <Text style={styles.buttonText}>Github</Text>
                </Pressable>
            )}
            {site && (
                <Pressable style={styles.button} onPress={() => window.open(site)}>
                    <Text style={styles.buttonText}>Website</Text>
                </Pressable>
            )}
            {steam && (
                <Pressable style={styles.button} onPress={() => window.open(steam)}>
                    <Text style={styles.buttonText}>Steam</Text>
                </Pressable>
            )}
        </View>
    );
};

export { MyCards, Foot, TitleOfPage, FeaturedCard, Highlight, Piece, Pieces, UnderConstruction, IframeEmbed, HighlightView, InProgress, HorizontalLinks };