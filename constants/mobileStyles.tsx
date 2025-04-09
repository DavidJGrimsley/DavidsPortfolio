import { StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "./Colors";
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from "expo-linear-gradient";


const colorScheme = useColorScheme();


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
        marginLeft: RFPercentage(3),
        marginRight: RFPercentage(2),
        marginVertical: RFPercentage(3),
        width: RFPercentage(95),
        // alignContent: 'center',
        // justifyContent: 'center',
        // alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
    },
    title: {
        fontSize: RFPercentage(6),
        textAlign: 'left',
        fontWeight: 'bold',
        color: Colors[colorScheme ?? 'light'].tint,
        marginLeft: RFPercentage(2),
    },
    caption: {
        fontSize: RFPercentage(1.65),
        textAlign: 'right',
        color: Colors[colorScheme ?? 'light'].background,
        marginRight: RFPercentage(5),
    },
    imageContainer: {
        flexDirection: 'row',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginHorizontal: RFPercentage(3),
        // width: '100%',
        height: RFPercentage(30), // Adjust the height as needed
    },
    image: {
        height: '80%',
        width: '100%',
    },
    breakdown: {
        fontSize: RFPercentage(2),
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
        padding: RFPercentage(1),
        // opacity: 0.7,
        justifyContent: 'space-around',
    },
    listHeader: {
        fontSize: RFPercentage(3),
        textAlign: 'left',
        fontWeight: 'bold',
        color: Colors[colorScheme ?? 'light'].accent,
    },
    skills: {
        textAlign: 'left',
        fontSize: RFPercentage(2),
        color: Colors[colorScheme ?? 'light'].background,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: Colors[colorScheme ?? 'light'].accent,
        padding: RFPercentage(1),
        borderRadius: RFPercentage(1),
        margin: RFPercentage(1),
        width: RFPercentage(20),
        alignSelf: 'center',
    },
    buttonText: {
        color: Colors[colorScheme ?? 'light'].secondary,
        textAlign: 'center',
        fontSize: RFPercentage(2),
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