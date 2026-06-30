import React from 'react';
import Head from 'expo-router/head';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';

import {
  AUTHOR_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
  SITE_URL,
  joinUrl,
  toAbsoluteUrl,
} from '@/constants/seo';

export type SeoStructuredData = Record<string, unknown> | Record<string, unknown>[];

export type SeoHeadProps = {
  title?: string;
  description?: string;
  path?: string;
  canonicalUrl?: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: SeoStructuredData;
};

function serializeJsonLd(payload: Record<string, unknown>) {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

function createStructuredDataPayload(structuredData?: SeoStructuredData) {
  return Array.isArray(structuredData)
    ? {
        '@context': 'https://schema.org',
        '@graph': structuredData,
      }
    : structuredData
      ? {
          '@context': 'https://schema.org',
          ...structuredData,
        }
      : null;
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return SITE_NAME;
  if (trimmed.toLowerCase().includes(SITE_NAME.toLowerCase())) return trimmed;
  return `${trimmed} | ${SITE_NAME}`;
}

export function SeoHead({
  title,
  description,
  path,
  canonicalUrl,
  keywords,
  image,
  imageAlt,
  type = 'website',
  noIndex = false,
  structuredData,
}: SeoHeadProps) {
  const resolvedTitle = normalizeTitle(title ?? SITE_NAME);
  const resolvedDescription = (description ?? DEFAULT_DESCRIPTION).trim();
  const resolvedKeywords = (keywords && keywords.length > 0 ? keywords : DEFAULT_KEYWORDS)
    .map((k) => k.trim())
    .filter(Boolean);

  const resolvedCanonical = canonicalUrl
    ? canonicalUrl
    : path
      ? joinUrl(SITE_URL, path === '/' ? '' : path)
      : SITE_URL;

  const resolvedImage = toAbsoluteUrl(image ?? DEFAULT_OG_IMAGE_PATH);
  const resolvedImageAlt = imageAlt ?? `${resolvedTitle} preview image`;
  const structuredDataPayload = createStructuredDataPayload(structuredData);

  useFocusEffect(
    React.useCallback(() => {
      if (typeof document !== 'undefined') {
        document.title = resolvedTitle;
      }
    }, [resolvedTitle])
  );

  return (
    <Head key={resolvedCanonical}>
      <title>{resolvedTitle}</title>

      <meta name="description" content={resolvedDescription} />
      <meta name="author" content={AUTHOR_NAME} />
      <meta
        name="robots"
        content={
          noIndex
            ? 'noindex, nofollow'
            : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        }
      />
      <meta
        name="googlebot"
        content={
          noIndex
            ? 'noindex, nofollow'
            : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        }
      />

      {resolvedKeywords.length > 0 ? (
        <meta name="keywords" content={resolvedKeywords.join(', ')} />
      ) : null}

      <link rel="canonical" href={resolvedCanonical} />

      {/* Open Graph */}
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      {resolvedImage ? <meta property="og:image" content={resolvedImage} /> : null}
      {resolvedImage ? <meta property="og:image:alt" content={resolvedImageAlt} /> : null}

      {/* Twitter */}
      <meta name="twitter:card" content={resolvedImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      {resolvedImage ? <meta name="twitter:image" content={resolvedImage} /> : null}
      {resolvedImage ? <meta name="twitter:image:alt" content={resolvedImageAlt} /> : null}
      <meta name="twitter:url" content={resolvedCanonical} />

      {structuredDataPayload ? (
        React.createElement('script', {
          type: 'application/ld+json',
          dangerouslySetInnerHTML: {
            __html: serializeJsonLd(structuredDataPayload),
          },
        } as React.ScriptHTMLAttributes<HTMLScriptElement>)
      ) : null}
    </Head>
  );
}

export function StructuredDataScript({
  structuredData,
}: {
  structuredData?: SeoStructuredData;
}) {
  const structuredDataPayload = createStructuredDataPayload(structuredData);

  if (Platform.OS !== 'web' || !structuredDataPayload) {
    return null;
  }

  return React.createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: {
      __html: serializeJsonLd(structuredDataPayload),
    },
  } as React.ScriptHTMLAttributes<HTMLScriptElement>);
}
