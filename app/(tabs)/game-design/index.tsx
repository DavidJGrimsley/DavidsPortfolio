import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import { GameBackgroundGradient } from '../../../constants/styles';

export default function GameDesign() {
  return (
    <CategoryIndexWrapper
      gradient={<GameBackgroundGradient />}
      titleA="Game"
      titleB="Design"
      category="game-design"
    />
  );
}
