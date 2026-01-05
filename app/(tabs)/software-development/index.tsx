import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import { GameBackgroundGradient } from '../../../constants/styles';

export default function SoftwareDevelopment() {
  return (
    <CategoryIndexWrapper
      gradient={<GameBackgroundGradient />}
      titleA="Software"
      titleB="Development"
      category="software-development"
    />
  );
}
