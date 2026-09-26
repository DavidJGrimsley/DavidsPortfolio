import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import type { GenerateMetadataFunction } from 'expo-router/server';
import { landingMetadata } from '@/constants/landing-seo';

export const generateMetadata: GenerateMetadataFunction = () => landingMetadata('/portfolio/website-development');

export default function WebDev() {
  return (
    <CategoryIndexWrapper
      titleA="Web"
      titleB="Development"
      category="website-development"
      introBody="A good website makes its purpose clear and helps people find what they need."
      introSubBody="Explore sites I've built with responsive layouts, accessibility, and search visibility in mind."
    />
  );
}

