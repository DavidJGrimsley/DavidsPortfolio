import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from '@/hooks/useColorScheme';
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
    <View className="flex-row items-center justify-center" style={{ gap: RFPercentage(1) }}>
      <Text 
        className="font-semibold" 
        style={{ 
          color: iconColor,
          fontSize: RFPercentage(2.4)
        }}
      >
        Pokémon
      </Text>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100"
        style={{ marginTop: RFPercentage(0.4) }}
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

// Credit component for the attribution
export const PokemonButtonCredit: React.FC = () => {
  return (
    <Text 
      className="text-center text-[#222]" 
      style={{ 
        fontSize: RFPercentage(1.2),
        marginTop: RFPercentage(0.5)
      }}
    >
      Pokeball by Athok from Noun Project (CC BY 3.0)
    </Text>
  );
};
