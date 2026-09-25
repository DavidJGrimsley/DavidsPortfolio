import { Text, View } from "react-native";
import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import type { GenerateMetadataFunction } from 'expo-router/server';
import { landingMetadata } from '@/constants/landing-seo';

import Game from "@/components/TicTacToe";

export const generateMetadata: GenerateMetadataFunction = () => landingMetadata('/portfolio/game-design');
export default function GameDesign() {
  return (
    <CategoryIndexWrapper
      titleA="Game"
      titleB="Design"
      category="game-design"
      introBody="Games sparked my interest in building software. I design experiences that feel clear, playful, and rewarding."
      introSubBody="Explore my games and prototypes, including a playable demo below."
      footerContent={
        <View className="mt-[4%] rounded-[2%] bg-themed page-lead">
          <Text className="detail-subheader text-themed mb-[1%]">Try the Tic-Tac-Toe demo</Text>
          <Text className="detail-body text-secondary mb-[2%]">
            A quick playable shows my approach to lightweight game loops, state management, and responsive layouts. It mirrors how I prototype mechanics before scaling them into larger systems.
          </Text>
          <View className="bg-tint rounded-[1.2%] p-[1%]">
            <Game />
          </View>
        </View>
      }
    />
  );
}

