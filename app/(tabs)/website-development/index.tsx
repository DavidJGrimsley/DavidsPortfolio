import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import { WebBackgroundGradient } from '../../../constants/styles';

export default function WebDev() {
  return (
    <CategoryIndexWrapper
      gradient={<WebBackgroundGradient />}
      titleA="Web"
      titleB="Development"
      category="website-development"
    />
  );
}
