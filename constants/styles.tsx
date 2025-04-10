//Import the StyleSheet module from react-native.
import { StyleSheet } from 'react-native';
import Colors from './Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { DeviceType, getDeviceTypeAsync } from 'expo-device';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RFPercentage } from "react-native-responsive-fontsize";

const colorScheme = useColorScheme();
let isMobileDevice = false;

(async () => {
    const deviceType = await getDeviceTypeAsync();
    switch (deviceType) {
      case DeviceType.PHONE:
      case DeviceType.TABLET:
        isMobileDevice = true;
        break;
      case DeviceType.DESKTOP:
      case DeviceType.UNKNOWN:
      default:
        isMobileDevice = false;
        break;
    }
  })();

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

//Define your styles using StyleSheet.create.
export const styles = StyleSheet.create({
    // Styles for all in the app/site with a font family of Lora
    text: {
    },

    // styles for the Side nav
    sideNav: {
        display: 'flex',
        alignItems: 'center',
        margin: RFPercentage(0.5),
        width: '50%',
        borderRadius: RFPercentage(1.5),
    },
    sideNavText: {
        textAlign: 'center',
        opacity: 0.5,
        color: Colors[colorScheme ?? 'light'].text,
        fontSize: RFPercentage(1),
        fontWeight: '300',
    },
    // Styles for the title on each screen
    mainTitle: {
        textAlign: 'center',
        paddingBottom: RFPercentage(1.2),
        paddingTop: RFPercentage(1.2),
        zIndex: -1,
    },
    mainTitleText: {
        position: 'relative',
        textTransform: 'uppercase',
        fontSize: RFPercentage(5),
        fontWeight: '700',
        fontFamily: 'Rubik',
        color: Colors[colorScheme ?? 'light'].text,
    },
    mainTitleTextSpan: {
        color: Colors[colorScheme ?? 'light'].secondary,
    },
    mainTitleTextBg: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        color: Colors[colorScheme ?? 'light'].accent,
        zIndex: -1,
        transform: 'translate(-50%, -50%)',
        fontWeight: '800',
        opacity: 0.5,
        fontSize: RFPercentage(7),
    },
    // gradient background
    background: {
        position: 'absolute',
        zIndex: -5,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0, // Set bottom to 0 to make the background fill the entire screen height
    },
    // styles for the header
    headerBackground: {
        backgroundColor: Colors[colorScheme ?? 'light'].background,
        color: Colors[colorScheme ?? 'light'].secondary, 
    },
    // styles for the footer
    footer: {
        borderWidth: RFPercentage(0.2),
        borderColor: Colors[colorScheme ?? 'light'].accent,
        height: RFPercentage(5),
        margin: RFPercentage(1),
        padding: RFPercentage(1),
        borderRadius: RFPercentage(0.5),
        alignItems: 'center',
        justifyContent: 'center',
        width: '40%',
    },
    footerText: {
        color: Colors[colorScheme ?? 'light'].accent,
        fontSize: RFPercentage(1.2),
    },
    // Extra space if needed
    spacer: {
        flex: 1,
    },
    // Styles for the home page
    home:{
        // display: 'flex',
        flex: 1,
        // alignItems: "center",
        // zIndex: 3,
        // width: '100%',
        marginBottom: RFPercentage(1),
    },
    scrollHome:{
        alignItems: "center",
        paddingVertical: RFPercentage(2),
        flex: 1,
        // width: '100%',
    },
    featuredCardContainer: {
        alignItems: "center",
        padding: RFPercentage(2),
        marginVertical: RFPercentage(2),
    },
    // Styles for Portfolio pages
    page: {
        flex: 1,
        width: '100%',
        alignItems: "center",
        marginBottom: RFPercentage(1),  
    },
    scrollCards: {
        justifyContent: "space-around",
        alignItems: "center",  
        width: RFPercentage(95),
        display: 'flex',
        flex: 1,
        // flexWrap: 'wrap',
        // alignItems: 'center',
        // backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    cardsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',    
    },
    cardsRow: {
        alignItems: 'center',
        flexDirection: isMobileDevice ? 'column' : 'row',
    },
    cardsCol: {
        // padding: 20,
    },
    card: {
        // padding: 20,
        margin: RFPercentage(3),
        width: isMobileDevice ? '100%' : RFPercentage(60),
    },
    // Webview for embedded sites
    webview: { 
        height: '85%'
    },
    // styles for InProgress banner
    inProgress: {
        backgroundColor: Colors[colorScheme ?? 'light'].accent,
        padding: RFPercentage(1),
        borderRadius: RFPercentage(0.5),
        margin: RFPercentage(1),
    },
    inProgressText: {
        color: Colors[colorScheme ?? 'light'].secondary,
        textAlign: 'center',
        fontSize: RFPercentage(1.2),
    },
    // styles for the About page
    website: {
        display: 'flex',
        padding: RFPercentage(1),
        margin: RFPercentage(1),
        borderRadius: RFPercentage(0.5),
        borderWidth: RFPercentage(0.1),
        borderColor: Colors[colorScheme ?? 'light'].accent,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '60%',
        minWidth: '40%',
        backgroundColor: applyOpacity(Colors[colorScheme ?? 'light'].background, 0.2),
    },
    websiteText: {
        color: Colors[colorScheme ?? 'light'].accent,
        textAlign: 'center',
        fontSize: RFPercentage(1.2),
    },
    websiteButton: {
        backgroundColor: Colors[colorScheme ?? 'light'].accent,
        color: Colors[colorScheme ?? 'light'].secondary,
        textAlign: 'center',
        fontSize: RFPercentage(2),
        padding: RFPercentage(0.5),
        borderRadius: RFPercentage(0.5),
    },
    websiteButtonText: {
        color: Colors[colorScheme ?? 'light'].secondary,
        textAlign: 'center',
        fontSize: RFPercentage(1.2),
    },
    surveyView: {
        width: '65%',
        marginVertical: RFPercentage(2.5),
    },
    survey: {
        backgroundColor: Colors[colorScheme ?? 'light'].accent,
        padding: RFPercentage(1),
        borderRadius: RFPercentage(0.5),
        margin: RFPercentage(1),
    },
    surveyText: {
        color: Colors[colorScheme ?? 'light'].secondary,
        textAlign: 'center',
        fontSize: RFPercentage(1.2),
    },
    aboutText: {
        color: Colors[colorScheme ?? 'light'].text,
        textAlign: 'center',
        fontSize: RFPercentage(1.2),
    },
    // For the Highlight component
    highlightView: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: applyOpacity(Colors[colorScheme ?? 'light'].tint, 0.5),
        borderRadius: RFPercentage(0.5),
        padding: RFPercentage(1),
        margin: RFPercentage(1),
    },
    highlightTitle: {
        color: Colors[colorScheme ?? 'light'].text,
        textAlign: 'center',
        fontSize: RFPercentage(2),
        fontWeight: '700',
    },
    highlightHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    highlightCaption: {
        color: Colors[colorScheme ?? 'light'].accent,
        textAlign: 'center',
        padding: RFPercentage(.5),
        fontSize: RFPercentage(1.2),
        backgroundColor: applyOpacity(Colors[colorScheme ?? 'light'].secondary, 0.15),
    },
    highlightPicture: {
        margin: RFPercentage(1),
        width: RFPercentage(30),
        height: RFPercentage(20),
    },
    highlightDescription: {
        color: Colors[colorScheme ?? 'light'].text,
        textAlign: 'center',
        fontSize: RFPercentage(1.5),
        marginBottom: RFPercentage(1),
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
    horizontalLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    codeContainer: {
        backgroundColor: '#f5f5f5', // Light gray background
        borderRadius: 5,
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd', // Light border
        width: '70%',
    },
    codeText: {
        fontFamily: 'Courier New', // Monospace font
        fontSize: 14,
        color: '#333', // Dark text color
        lineHeight: 20,
        // whiteSpace: 'pre-wrap', // Preserve formatting
    },
});


export const BackgroundGradient = () => {
    return (
        <LinearGradient
            // Background Linear Gradient
            colors={[Colors[colorScheme ?? 'light'].background, Colors[colorScheme ?? 'light'].secondary, 'transparent' ]}
            style={styles.background}
        />
    );
};

export const MobileBackgroundGradient = () => {
    return (
        <LinearGradient
        // Background Linear Gradient
        colors={['transparent', Colors[colorScheme ?? 'light'].background, Colors[colorScheme ?? 'light'].secondary, 'transparent' ]}
        style={styles.background}
        />
    );
};

export const GameBackgroundGradient = () => {
    return (
        <LinearGradient
        // Background Linear Gradient
        colors={[Colors[colorScheme ?? 'light'].secondary, 'transparent', Colors[colorScheme ?? 'light'].background, Colors[colorScheme ?? 'light'].secondary,]}
        style={styles.background}
        />
    );
};

export const WebBackgroundGradient = () => {
    return (
        <LinearGradient
        // Background Linear Gradient
        colors={[Colors[colorScheme ?? 'light'].background, Colors[colorScheme ?? 'light'].secondary, 'transparent', Colors[colorScheme ?? 'light'].background,]}
        style={styles.background}
        />
    );
};

export const AboutBackgroundGradient = () => {
    return (
        <LinearGradient
        // Background Linear Gradient
        colors={['transparent', Colors[colorScheme ?? 'light'].background, Colors[colorScheme ?? 'light'].secondary, 'transparent', Colors[colorScheme ?? 'light'].background,]}
        style={styles.background}
        />
    );
};
