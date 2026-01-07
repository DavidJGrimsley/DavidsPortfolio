import React from 'react';
import { CategoryDetailWrapper, generateStaticParamsForCategory } from '@/components/Categories/CategoryDetailWrapper';
import { HelloWave } from '@/components/QuantumAnimation';
import { Piece } from '@/types/portfolio';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return generateStaticParamsForCategory('website-development');
}

export default function Page() {
  return (
    <CategoryDetailWrapper 
      category="website-development"
      renderExtraContent={(piece: Piece) => (
        (piece.displayTitle || piece.title).includes('Quantum') ? <HelloWave /> : null
      )}
    />
  );
}

