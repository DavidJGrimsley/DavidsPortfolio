import React from 'react';
import { View } from 'react-native';
import { CategoryDetailWrapper, generateStaticParamsForCategory } from '@/components/Categories/CategoryDetailWrapper';
import { HelloWave } from '@/components/QuantumAnimation';
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

