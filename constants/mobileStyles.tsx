import { StyleSheet, Dimensions } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "./Colors";
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from "expo-linear-gradient";


const colorScheme = useColorScheme();
const getScreenWidth = () => Dimensions.get('window').width;
const isSmallScreen = () => getScreenWidth() < 768;


// Utility function to apply opacity multiplier to a hex color
const applyOpacity = (hexColor: string, opacity: number) => {
// Remove the hash at the start if it's there
hexColor = hexColor.replace(/^#/, '');

// Parse r, g, b values
const bigint = parseInt(hexColor, 16);
const r = (bigint >> 16) & 255;
const g = (bigint >> 8) & 255;
const b = bigint & 255;

// Return the RGBA color
return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const mobileStyles = StyleSheet.create({
    // Styles for pages with cards on them
    background: {
        position: 'absolute',
        zIndex: -5,
        left: 0,
        right: 0,
        top: 0,
        bottom: RFPercentage(30),
    },
    scroll: {
        backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    page: {
        display: 'flex',
        alignContent: 'center',
        justifyContent: 'space-around',
        flex: 1,
        marginHorizontal: RFPercentage(2),
        marginVertical: RFPercentage(3),
        width: '95%',
        maxWidth: 1200,
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    title: {
        fontSize: RFPercentage(5),
        textAlign: 'left',
        fontWeight: 'bold',
        color: Colors[colorScheme ?? 'light'].tint,
        marginLeft: RFPercentage(2),
    },
    caption: {
        fontSize: RFPercentage(2),
        textAlign: 'right',
        color: Colors[colorScheme ?? 'light'].background,
        marginRight: RFPercentage(2),
        marginLeft: RFPercentage(2),
    },
    imageContainer: {
        flexDirection: 'row',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: RFPercentage(2),
        marginVertical: RFPercentage(2),
        width: '100%',
        alignSelf: 'center',
        height: RFPercentage(40),
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    breakdown: {
        fontSize: RFPercentage(2.2),
        textAlign: 'left',
        color: Colors[colorScheme ?? 'light'].text,
        marginBottom: RFPercentage(1),
    },
    YTView: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: RFPercentage(2),
    },
    listView: {
        marginVertical: RFPercentage(1),
        backgroundColor: applyOpacity(Colors[colorScheme ?? 'light'].secondary, .4),
        borderRadius: RFPercentage(1),
        padding: RFPercentage(1.5),
        width: '100%',
        justifyContent: 'space-around',
    },
    listHeader: {
        fontSize: RFPercentage(3.2),
        textAlign: 'left',
        fontWeight: 'bold',
        color: Colors[colorScheme ?? 'light'].accent,
    },
    skills: {
        textAlign: 'left',
        fontSize: RFPercentage(2.2),
        color: Colors[colorScheme ?? 'light'].background,
        fontWeight: 'bold',
    },
    
    
});

export const MobileDetailsBackgroundGradient = () => {
    return (
        <LinearGradient
            // Background Linear Gradient
            colors={['white', Colors[colorScheme ?? 'light'].secondary, Colors[colorScheme ?? 'light'].background]}
            style={mobileStyles.background}
        />
    );
};