import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { type Href, router } from "expo-router";
import { ThemedText } from "@/components/UI/ThemedText";
import { TabContainer } from "@/components/navigation/TabContainer";
import { getContent } from "@/services/contentApi";
import type { ServiceCard } from "@/types/content";


const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ServicesPage = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getContent()
      .then((payload) => {
        if (!isMounted) return;
        setServices(payload.services);
        setError(null);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const content = useMemo(() => {
    if (isLoading) {
      return <ThemedText className="text-base opacity-80">Loading services…</ThemedText>;
    }

    if (error) {
      return <ThemedText className="text-base text-red-400">{error}</ThemedText>;
    }

    if (services.length === 0) {
      return <ThemedText className="text-base opacity-80">No services available yet.</ThemedText>;
    }

    return services.map((service, index) => {
      const isHovered = hoveredId === service.id;

      return (
        <Pressable
          key={service.id}
          className={`rounded-3xl p-[4%] border ${index < services.length - 1 ? "mb-4" : ""}`}
          style={({ pressed }) => ({
            borderColor: service.accent,
            backgroundColor: hexToRgba(service.accent, pressed ? 0.2 : isHovered ? 0.14 : 0.08),
            transform: [{ scale: pressed ? 0.985 : isHovered ? 1.01 : 1 }],
            shadowColor: service.accent,
            shadowOpacity: isHovered ? 0.35 : 0.15,
            shadowRadius: isHovered ? 18 : 8,
            shadowOffset: { width: 0, height: isHovered ? 10 : 6 },
          })}
          onPress={() => router.push(`/(tabs)/services/${service.primaryCtaId}` as Href)}
          onHoverIn={() => setHoveredId(service.id)}
          onHoverOut={() => setHoveredId(null)}
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
        </Pressable>
      );
    });
  }, [error, hoveredId, isLoading, services]);

  return (
    <TabContainer
      titleA="Whatcha"
      titleB="need?"
      leadBody="It would be my pleasure to meet and discuss your goals. Whether you need a mobile app, website, game, or other software, I’ll get to know the why before I start to code. The greater purpose of your business or organization will be baked into the layout, UI, and functionality of your project."
      leadSubBody="My normal tech stack includes Expo, React Native, , but I’m happy to explore other technologies to turn your ideas into reality."
      seo={{
        title: 'Services: website building, apps, APIs, tutoring, games',
        description:
          'Hire David Grimsley for website building, app development, API/backend development, game development, tutoring, and online presence services. Request a quote and get started.',
        path: '/services',
        keywords: [
          'website building',
          'website made',
          'web developer for hire',
          'small business website',
          'portfolio website',
          'app development',
          'React Native',
          'API development',
          'backend developer',
          'tutoring computer science',
          'game development',
          'online presence',
          'SEO services',
        ],
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'ProfessionalService',
          name: 'David Grimsley – Software & Web Development Services',
          url: 'https://davidjgrimsley.com/services',
          areaServed: 'US',
          serviceType: [
            'Website building',
            'Web development',
            'App development',
            'API development',
            'Game development',
            'Tutoring',
            'Online presence services',
          ],
        },
        type: 'website',
      }}
    >
      {content}
    </TabContainer>
  );
};

export default ServicesPage;
