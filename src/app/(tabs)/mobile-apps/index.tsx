import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import { MobileBackgroundGradient } from "@/components/Gradients";

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
