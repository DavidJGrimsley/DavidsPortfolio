import { Text, View } from "react-native";
import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import Game from "@/components/TicTacToe";

export default function GameDesign() {
  return (
    <CategoryIndexWrapper
      titleA="Game"
      titleB="Design"
      category="game-design"
      introContent={
        <View className="p-[2%]" style={{ borderLeftWidth: 4, borderLeftColor: "var(--color-tint)" }}>
          <Text className="detail-body text-themed">
            I design gameplay systems that balance feel, readability, and technical rigor—tight input loops, performant rendering, and clean data structures for AI, UI, and narrative hooks. My work spans Godot, React Native, and custom integrations with external services to keep experiences responsive and failure-tolerant.
          </Text>
          <Text className="detail-body text-secondary mt-[1%]">
            From networked events to shader-driven polish, I blend design intent with engineering constraints so prototypes can evolve into maintainable, shippable builds.
          </Text>
        </View>
      }
      footerContent={
        <View className="mt-[4%] p-[2%] rounded-[2%] bg-themed" style={{ borderLeftWidth: 4, borderLeftColor: "var(--color-tint)" }}>
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

