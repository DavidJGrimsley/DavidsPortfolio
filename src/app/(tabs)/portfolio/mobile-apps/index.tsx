import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import type { GenerateMetadataFunction } from 'expo-router/server';
import { landingMetadata } from '@/constants/landing-seo';

export const generateMetadata: GenerateMetadataFunction = () => landingMetadata('/portfolio/mobile-apps');

export default function MobileApps() {
  return (
    <CategoryIndexWrapper
      titleA="Mobile"
      titleB="Applications"
      category="mobile-apps"
      introBody="I build cross-platform apps with React Native and Expo."
      introSubBody="Browse the projects for features, screenshots, and the choices behind each build."
    />
  );
}
