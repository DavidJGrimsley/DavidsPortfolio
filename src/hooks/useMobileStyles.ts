import { useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { useThemeColor } from '@/hooks/useThemeColor';

const getScreenWidth = () => Dimensions.get('window').width;

export type MobileStyles = ReturnType<typeof createMobileStyles>;

function createMobileStyles(colors: {
  background: string;
  text: string;
  tint: string;
  accent: string;
  secondary: string;
}) {
  const isSmallScreen = getScreenWidth() < 768;

  return StyleSheet.create({
    background: {
      position: 'absolute',
      zIndex: -5,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    scroll: {
      backgroundColor: colors.background,
    },
    page: {
      flex: 1,
      marginHorizontal: RFPercentage(2),
      marginVertical: RFPercentage(3),
      width: '95%',
      maxWidth: 1200,
      alignSelf: 'center',
      justifyContent: 'space-around',
    },
    title: {
      fontSize: RFPercentage(isSmallScreen ? 4 : 5),
      textAlign: 'left',
      fontWeight: 'bold',
      color: colors.tint,
      marginLeft: RFPercentage(2),
    },
    caption: {
      fontSize: RFPercentage(2),
      textAlign: 'right',
      color: colors.text,
      marginRight: RFPercentage(2),
      marginLeft: RFPercentage(2),
      opacity: 0.85,
    },
    imageContainer: {
      flexDirection: 'row',
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
      color: colors.text,
      marginBottom: RFPercentage(1),
    },
    YTView: {
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: RFPercentage(2),
    },
    listView: {
      marginVertical: RFPercentage(1),
      backgroundColor: colors.secondary,
      borderRadius: RFPercentage(1),
      padding: RFPercentage(1.5),
      width: '100%',
      justifyContent: 'space-around',
      opacity: 0.4,
    },
    listHeader: {
      fontSize: RFPercentage(3.2),
      textAlign: 'left',
      fontWeight: 'bold',
      color: colors.accent,
      opacity: 1,
    },
    skills: {
      textAlign: 'left',
      fontSize: RFPercentage(2.2),
      color: colors.text,
      fontWeight: 'bold',
      opacity: 1,
    },
    subtitle: {
      fontSize: RFPercentage(3),
      textAlign: 'left',
      fontWeight: 'bold',
      color: colors.tint,
      marginTop: RFPercentage(2),
      marginBottom: RFPercentage(1),
    },
    skillsUsed: {
      textAlign: 'left',
      fontSize: RFPercentage(1.8),
      color: colors.text,
      padding: RFPercentage(1),
      marginHorizontal: RFPercentage(0.5),
      marginVertical: RFPercentage(0.5),
      borderRadius: RFPercentage(0.5),
      borderWidth: 1,
      borderColor: colors.tint,
    },
    skillsLearned: {
      textAlign: 'left',
      fontSize: RFPercentage(1.8),
      color: colors.text,
      padding: RFPercentage(1),
      marginHorizontal: RFPercentage(0.5),
      marginVertical: RFPercentage(0.5),
      borderRadius: RFPercentage(0.5),
      borderWidth: 1,
      borderColor: colors.accent,
    },
  });
}

export function useMobileStyles() {
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const accent = useThemeColor({}, 'accent');
  const secondary = useThemeColor({}, 'secondary');

  return useMemo(
    () => createMobileStyles({ background, text, tint, accent, secondary }),
    [background, text, tint, accent, secondary]
  );
}
