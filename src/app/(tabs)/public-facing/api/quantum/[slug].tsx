import { useLocalSearchParams } from "expo-router";

import {
  QUANTUM_INTEGRATION_DOCS,
  QuantumIntegrationDocs,
} from "@/components/PublicFacing/api/quantum-integration-docs";

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return QUANTUM_INTEGRATION_DOCS.map((doc) => ({ slug: doc.slug }));
}

export default function QuantumIntegrationDocPage() {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const resolvedSlug = Array.isArray(slug) ? slug[0] : slug;

  return <QuantumIntegrationDocs slug={resolvedSlug} />;
}
