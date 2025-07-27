import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { RFPercentage } from 'react-native-responsive-fontsize';

interface PokemonButtonProps {
  size?: number;
  color?: string;
}

export const PokemonButton: React.FC<PokemonButtonProps> = ({ 
  size = RFPercentage(2.4), // Default size, 
  color 
}) => {
  const colorScheme = useColorScheme();
  const iconColor = color || '#000000'; // Black color

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: iconColor }]}>Pokémon</Text>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100"
        style={styles.icon}
      >
        <Path
          d="m50 6.25c-24.062 0-43.75 19.688-43.75 43.75s19.688 43.75 43.75 43.75 43.75-19.688 43.75-43.75-19.688-43.75-43.75-43.75zm0 32.812c5.9375 0 10.938 5 10.938 10.938s-5 10.938-10.938 10.938-10.938-5-10.938-10.938 5-10.938 10.938-10.938zm0 52.5c-22.5 0-40.938-18.125-41.562-40.625h28.75c0.625 6.5625 6.25 11.875 12.812 11.875s12.5-5.3125 12.812-11.875h28.75c-0.625 22.5-19.062 40.625-41.562 40.625z"
          fill={iconColor}
        />
        <Path
          d="m50 57.812c4.375 0 7.8125-3.4375 7.8125-7.8125s-3.4375-7.8125-7.8125-7.8125-7.8125 3.4375-7.8125 7.8125 3.4375 7.8125 7.8125 7.8125z"
          fill={iconColor}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(1),
  },
  text: {
    fontSize: RFPercentage(2.4),
    fontWeight: '600',
  },
  icon: {
    // Additional styling if needed
    marginTop: RFPercentage(0.4),
  },
});

// Credit component for the attribution
export const PokemonButtonCredit: React.FC = () => {
  return (
    <Text style={creditStyles.credit}>
      Pokeball by Athok from Noun Project (CC BY 3.0)
    </Text>
  );
};

const creditStyles = StyleSheet.create({
  credit: {
    fontSize: RFPercentage(1.2),
    color: '#222',
    textAlign: 'center',
    marginTop: RFPercentage(0.5),
  },
});
