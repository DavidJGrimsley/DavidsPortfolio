import { useLocalSearchParams } from "expo-router";
import type { GenerateMetadataFunction, Metadata } from "expo-router/server";

import {
  LLMS_TXT_PATH,
  QUANTUM_INTEGRATION_DOCS,
  QuantumIntegrationDocs,
} from "@/components/PublicFacing/api/quantum-integration-docs";
import { SITE_URL, joinUrl } from "@/constants/seo";

function getSlug(params: Record<string, string | string[]>): string | undefined {
  const slug = params.slug;
  return Array.isArray(slug) ? slug[0] : slug;
}

function buildIntegrationMetadata(slug?: string): Metadata {
  const doc = QUANTUM_INTEGRATION_DOCS.find((item) => item.slug === slug) ?? QUANTUM_INTEGRATION_DOCS[0];
  const pageUrl = joinUrl(SITE_URL, doc.path);
  const markdownUrl = joinUrl(SITE_URL, doc.markdownPath);
  const llmsUrl = joinUrl(SITE_URL, LLMS_TXT_PATH);

  return {
    title: doc.title,
    description: doc.description,
    keywords: ["Quantum API", doc.title, doc.kind, "developer documentation"],
    authors: [{ name: "David Grimsley", url: SITE_URL }],
    robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    alternates: {
      canonical: pageUrl,
      types: { "text/markdown": markdownUrl },
    },
    icons: {
      other: [{ rel: "describedby", url: llmsUrl }],
    },
    openGraph: {
      title: doc.title,
      description: doc.description,
      url: pageUrl,
      siteName: "David Grimsley",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: doc.title,
      description: doc.description,
    },
  };
}

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return QUANTUM_INTEGRATION_DOCS.map((doc) => ({ slug: doc.slug }));
}

export const generateMetadata: GenerateMetadataFunction = (_request, params) =>
  buildIntegrationMetadata(getSlug(params));

export default function QuantumIntegrationDocPage() {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const resolvedSlug = Array.isArray(slug) ? slug[0] : slug;

  return <QuantumIntegrationDocs slug={resolvedSlug} />;
}
