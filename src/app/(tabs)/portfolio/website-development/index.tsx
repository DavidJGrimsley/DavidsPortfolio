import { Text, View } from "react-native";
import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";

export default function WebDev() {
  return (
    <CategoryIndexWrapper
      titleA="Web"
      titleB="Development"
      category="website-development"
      introContent={
        <View>
          <Text className="detail-body text-themed">
            I craft fast, resilient web experiences with modern TypeScript stacks, API-first architectures, and SEO-ready rendering. From design systems to accessibility, I align UI polish with measurable performance budgets and observability.
          </Text>
          <Text className="detail-body text-secondary mt-[1%]">
            Deployments ship with CI/CD, analytics, and hardened security defaults so sites stay stable under traffic while remaining easy to iterate.
          </Text>
        </View>
      }
    />
  );
}

