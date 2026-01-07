import { CategoryDetailWrapper, generateStaticParamsForCategory } from '@/components/Categories/CategoryDetailWrapper';

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


