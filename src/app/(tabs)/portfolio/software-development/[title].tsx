import React from 'react';
import { View } from 'react-native';
import { CategoryDetailWrapper, generateStaticParamsForCategory } from '@/components/Categories/CategoryDetailWrapper';
import type { GenerateMetadataFunction } from 'expo-router/server';
import { portfolioPieceMetadata } from '@/constants/portfolio-seo';
import { HelloWave } from '@/components/QuantumAnimation';

export const generateMetadata: GenerateMetadataFunction = (_request, params) =>
  portfolioPieceMetadata('software-development', params.title);
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return generateStaticParamsForCategory('software-development');
}

export default function Page() {
  return (
    <CategoryDetailWrapper
      category="software-development"
      renderExtraContent={(piece) =>
        (piece.displayTitle || piece.title).includes('Quantum') ? (
          <View className="my-3">
            <HelloWave />
          </View>
        ) : null
      }
    />
  );
}

