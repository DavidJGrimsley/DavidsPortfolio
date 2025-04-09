//Import the StyleSheet module from react-native.
import { StyleSheet } from 'react-native';
import Colors from './Colors';
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


//Define your styles using StyleSheet.create.
export const tttStyles = StyleSheet.create({
    tttGameContainer: {
        display: 'flex',   
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: isMobileDevice ? 'column' : 'row',
    },
    tttHeader: {
        marginRight: RFPercentage(5),
        width: isMobileDevice ? RFPercentage(100) : RFPercentage(50),   
        backgroundColor: Colors[colorScheme ?? 'light'].background, 
        borderRadius: RFPercentage(2),
        opacity: 0.6,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tttHeaderText: {
        padding: RFPercentage(2),
        fontSize: RFPercentage(3),
        textAlign: 'center',
        color: Colors[colorScheme ?? 'light'].secondary,
    },
    status: {
        color: Colors[colorScheme ?? 'light'].text,
        fontSize: RFPercentage(2),
        fontWeight: '700',
        marginBottom: RFPercentage(1),
        textAlign: 'center',
    },
    tttBoardContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors[colorScheme ?? 'light'].tint,
        borderRadius: RFPercentage(1),
        padding: RFPercentage(1),
        textAlign: 'center',
    },
    tttBoard: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: RFPercentage(1),
        borderRadius: RFPercentage(0.5),
    },
    tttRow: {
        backgroundColor: Colors[colorScheme ?? 'light'].secondary,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tttSquare: {
        backgroundColor: Colors[colorScheme ?? 'light'].accent,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: RFPercentage(7),
        height: RFPercentage(7),
        padding: RFPercentage(1),
        margin: RFPercentage(0.5),
        borderRadius: RFPercentage(0.5),
    },
    tttSquareText: {
        color: Colors[colorScheme ?? 'light'].secondary,
        fontSize: RFPercentage(5),
    },
    tttHistory: {
        alignItems: 'center',        
    },
    tttHistoryText: {
        fontSize: RFPercentage(2),
    },
    tttHistoryButton: {
        backgroundColor: Colors[colorScheme ?? 'light'].background,
        color: Colors[colorScheme ?? 'light'].text,
        padding: RFPercentage(0.2),
        margin: RFPercentage(0.5),
        borderRadius: RFPercentage(0.2),
        fontSize: RFPercentage(2),
    },
});
