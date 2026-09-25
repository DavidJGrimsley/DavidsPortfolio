import { CategoryDetailWrapper, generateStaticParamsForCategory } from '@/components/Categories/CategoryDetailWrapper';
import type { GenerateMetadataFunction } from 'expo-router/server';
import { portfolioPieceMetadata } from '@/constants/portfolio-seo';

export const generateMetadata: GenerateMetadataFunction = (_request, params) =>
  portfolioPieceMetadata('mobile-apps', params.title);

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return generateStaticParamsForCategory('mobile-apps');
}

export default function Page() {
  return (
    <CategoryDetailWrapper 
      category="mobile-apps"
    />
  );
}


