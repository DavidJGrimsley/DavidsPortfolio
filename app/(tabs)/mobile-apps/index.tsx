import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import { MobileBackgroundGradient } from "@/constants/styles";

export default function MobileApps() {
  return (
    <CategoryIndexWrapper
      gradient={<MobileBackgroundGradient />}
      titleA="Mobile"
      titleB="Applications"
      category="mobile-apps"
    />
  );
}
