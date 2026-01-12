import { Text, View } from "react-native";
import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";

export default function MobileApps() {
  return (
    <CategoryIndexWrapper
      titleA="Mobile"
      titleB="Applications"
      category="mobile-apps"
      introContent={
        <View className="p-[2%]" style={{ borderLeftWidth: 4, borderLeftColor: "var(--color-tint)" }}>
          <Text className="detail-body text-themed">
            I build production-ready React Native and Expo apps with offline-first data flows, responsive UI systems, and cloud-backed APIs. From standing up CI/CD with EAS to integrating native modules and real-time features, I own the full lifecycle—architecture, performance tuning, and polished interactions across iOS, Android, and web.
          </Text>
          <Text className="detail-body text-secondary mt-[1%]">
            Expect thoughtful navigation patterns, accessibility baked in from the start, and resilient network handling that keeps experiences smooth even when connectivity drops.
          </Text>
        </View>
      }
    />
  );
}
