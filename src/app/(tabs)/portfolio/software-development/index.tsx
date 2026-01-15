import { Text, View } from "react-native";
import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";

export default function SoftwareDevelopment() {
  return (
    <CategoryIndexWrapper
      titleA="Software"
      titleB="Development"
      category="software-development"
      introContent={
        <View className="page-lead">
          <Text className="detail-body text-themed">
            I build full-stack systems that connect clean APIs, reliable data layers, and approachable interfaces. Whether it’s event-driven services, background workers, or integrations, I focus on observability, security, and predictable deployments.
          </Text>
          <Text className="detail-body text-secondary mt-[1%]">
            Expect well-documented contracts, thoughtful error handling, and automation that keeps releases safe and repeatable.
          </Text>
        </View>
      }
    />
  );
}

