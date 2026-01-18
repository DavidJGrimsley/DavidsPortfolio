import { Text, View } from "react-native";
import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import Game from "@/components/TicTacToe";

export default function GameDesign() {
  return (
    <CategoryIndexWrapper
      titleA="Game"
      titleB="Design"
      category="game-design"
      introBody="My love of video games is honestly the reason any of this is here. I was a gamer at five years old. My fondest childhood memories are huddled around the NES and SNES playing Duck Hunt and Donkey Kong Country. My gamertag is MrDJ2U on most platforms which is a nod to my DJ nickname from high school. I design and build games because I love the medium and want to create experiences that bring joy, challenge, and immersion to players. I'm also interested in educational gaming experiences and gamification in other medium."
      introSubBody="I design gameplay systems that strike a balance between feel, readability, and technical rigor—encompassing tight input loops, performant rendering, and clean data structures for AI, UI, and narrative hooks. My work spans Godot, React Native, and custom integrations with external services to keep experiences responsive and failure-tolerant. From networked events to shader-driven polish, I blend design intent with engineering constraints so prototypes can evolve into maintainable, shippable builds."
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

