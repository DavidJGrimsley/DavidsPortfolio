import React from "react";
import { View, Pressable } from "react-native";
import { type Href, router } from "expo-router";
import { ThemedText } from "@/components/UI/ThemedText";
import { TabContainer } from "@/components/Navigation/TabContainer";

interface ServiceCard {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  primaryCtaLabel: string;
  primaryCtaId: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  secondaryCtaIsRoute?: boolean;
  accent: string;
}

const accentColors: Record<string, string> = {
  blue: "#0E668B",
  green: "#1E9E70",
  purple: "#723B80",
  orange: "#EEA444",
  pink: "#D63C83",
};

const services: ServiceCard[] = [
  {
    id: "app-development",
    title: "App Development",
    tagline: "Turn your idea into reality",
    description:
      "Mobile and web apps built with React Native, tailored UX, and the right backend wiring so shipping to iOS and Android is smooth from day one.",
    features: [
      "Cross-platform React Native builds",
      "iOS and Android deployment",
      "Modern UI and UX design",
      "Backend integration and APIs",
      "Real-time features and databases",
      "App Store optimization",
    ],
    primaryCtaLabel: "Start your app project",
    primaryCtaId: "app-development",
    secondaryCtaLabel: "Email me",
    secondaryCtaUrl:
      "mailto:DavidJGrimsley@gmail.com?subject=App%20Development%20Inquiry",
    accent: accentColors.blue,
  },
  {
    id: "website-building",
    title: "Website Building",
    tagline: "Beautiful, fast, and responsive",
    description:
      "Business and portfolio sites that blend conversion-focused UX, performance, and SEO. Optional bundling with online presence services keeps listings consistent.",
    features: [
      "Portfolio and business sites",
      "E-commerce friendly",
      "Custom domain and email setup",
      "Responsive on every device",
      "SEO and performance minded",
      "Content management options",
    ],
    primaryCtaLabel: "Get your website",
    primaryCtaId: "website-building",
    secondaryCtaLabel: "See my work",
    secondaryCtaUrl: "https://davidjgrimsley.com",
    accent: accentColors.green,
  },
  {
    id: "game-development",
    title: "Game Development",
    tagline: "Bring your game concept to life",
    description:
      "From Fortnite experiences to Unreal, Unity, Roblox, and Scratch, I design and build interactive games and educational experiences that stay fun and purposeful.",
    features: [
      "Fortnite Experiences (UEFN and Verse)",
      "Unreal Engine and Unity",
      "Roblox and Scratch for education",
      "Game design consulting",
      "2D and 3D mechanics",
      "Multi-platform support",
    ],
    primaryCtaLabel: "Create your game",
    primaryCtaId: "game-development",
    secondaryCtaLabel: "Email me",
    secondaryCtaUrl:
      "mailto:DavidJGrimsley@gmail.com?subject=Game%20Development%20Inquiry",
    accent: accentColors.purple,
  },
  {
    id: "tutoring",
    title: "Tutoring",
    tagline: "Learn from an experienced developer",
    description:
      "Personalized tutoring in math, computer science, game dev, and web dev. One-on-one or group sessions with flexible virtual scheduling. Contact me for pricing.",
    features: [
      "Math: Geometry, Algebra, Calculus",
      "AP CSA, AP CSP, and web development",
      "Game dev: Fortnite, Unreal, Roblox",
      "Tailored one-on-one sessions",
      "Group classes available",
      "Flexible virtual scheduling",
    ],
    primaryCtaLabel: "Sign up for tutoring",
    primaryCtaId: "tutoring",
    secondaryCtaLabel: "Learn more",
    secondaryCtaUrl: "/(tabs)/services/learn",
    secondaryCtaIsRoute: true,
    accent: accentColors.orange,
  },
  {
    id: "online-presence",
    title: "Online Presence",
    tagline: "Own your business profiles everywhere",
    description:
      "Fix and level up business listings across Apple, Google, LinkedIn, and directories. Bundle with a polished site so your info stays accurate and consistent.",
    features: [
      "Apple Business Connect setup",
      "Google Business Profile accuracy",
      "LinkedIn company page refresh",
      "Directory cleanup (Yelp, Bing, more)",
      "Portfolio or landing page build",
      "Branded domain email and DNS",
      "Analytics and review links",
    ],
    primaryCtaLabel: "Book a consultation",
    primaryCtaId: "online-presence",
    secondaryCtaLabel: "Contact me for pricing",
    secondaryCtaUrl: "/(tabs)/contact",
    secondaryCtaIsRoute: true,
    accent: accentColors.pink,
  },
];

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ServicesPage = () => {
  const handleSecondaryAction = (url: string, isRoute: boolean) => {
    if (isRoute) {
      router.push(url as Href);
    } else {
      // External URL - open in new window on web
      if (typeof window !== "undefined") {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <TabContainer
      titleA="My"
      titleB="Services"
      lead={
        <>
          <ThemedText className="text-2xl font-bold mb-2">What I offer</ThemedText>
          <ThemedText className="text-base opacity-85">
            I provide app development, web design, game development, tutoring, and online presence services. Pick a service and fill out the intake form to get started.
          </ThemedText>
        </>
      }
    >
      {services.map((service, index) => (
        <View
          key={service.id}
          className={`rounded-3xl p-[4%] border ${index < services.length - 1 ? "mb-4" : ""}`}
          style={{
            borderColor: service.accent,
            backgroundColor: hexToRgba(service.accent, 0.08),
          }}
        >
          <ThemedText headingLevel={2} visualHeadingLevel={2} className="text-2xl font-bold">
            {service.title}
          </ThemedText>
          <ThemedText className="text-lg font-semibold text-tint mt-1 mb-2">
            {service.tagline}
          </ThemedText>
          <ThemedText className="text-base opacity-90 mb-3">
            {service.description}
          </ThemedText>

          <ThemedText className="text-xs uppercase tracking-wider font-bold mb-2 opacity-70">
            What you get:
          </ThemedText>
          <View className="mb-4">
            {service.features.map((feature) => (
              <ThemedText key={feature} className="text-base mb-1">
                • {feature}
              </ThemedText>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Pressable
              className="px-4 py-2.5 rounded-2.5 bg-tint"
              onPress={() => router.push(`/(tabs)/services/${service.primaryCtaId}` as Href)}
            >
              <ThemedText inverse className="font-bold text-base">
                {service.primaryCtaLabel}
              </ThemedText>
            </Pressable>

            {service.secondaryCtaUrl && service.secondaryCtaLabel ? (
              <Pressable
                className="px-4 py-2.5 rounded-2.5 border"
                style={{ borderColor: service.accent }}
                onPress={() => handleSecondaryAction(service.secondaryCtaUrl as string, service.secondaryCtaIsRoute ?? false)}
              >
                <ThemedText className="font-semibold text-base" style={{ color: service.accent }}>
                  {service.secondaryCtaLabel}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
    </TabContainer>
  );
};

export default ServicesPage;
