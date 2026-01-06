import { CategoryDetailWrapper, generateStaticParamsForCategory } from '@/components/Categories/CategoryDetailWrapper';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return generateStaticParamsForCategory('game-design');
}

export default function Page() {
  return (
    <CategoryDetailWrapper 
      category="game-design"
      enableScrollTracking={true}
    />
  );
}

