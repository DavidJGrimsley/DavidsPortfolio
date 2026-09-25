import { CategoryIndexWrapper } from "@/components/Categories/CategoryIndexWrapper";
import type { GenerateMetadataFunction } from 'expo-router/server';
import { landingMetadata } from '@/constants/landing-seo';

export const generateMetadata: GenerateMetadataFunction = () => landingMetadata('/portfolio/software-development');

export default function SoftwareDevelopment() {
  return (
    <CategoryIndexWrapper
      titleA="Software"
      titleB="Development"
      category="software-development"
      introBody="This is where I share APIs, backend work, integrations, and other software projects."
      introSubBody="Open a project to see the problem it solves and how I built it."
    />
  );
}

