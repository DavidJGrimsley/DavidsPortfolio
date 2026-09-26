import type { Metadata } from 'expo-server';
import rawPieces from '@json/pieces.json';

import { normalizePieces, type Pieces } from '@/types/portfolio';
import { DEFAULT_OG_IMAGE_PATH, SITE_NAME, SITE_URL, joinUrl, toAbsoluteUrl } from './seo';

type Category = keyof Pieces;
const pieces = normalizePieces(rawPieces);

export function portfolioPieceMetadata(category: Category, titleParam: string | string[] | undefined): Metadata {
  const title = Array.isArray(titleParam) ? titleParam[0] : titleParam;
  const piece = pieces[category].find((item) => item.title === title);
  if (!piece) {
    return {
      title: `Portfolio Project | ${SITE_NAME}`,
      description: 'Browse portfolio projects by David Grimsley.',
      robots: 'noindex, follow',
    };
  }

  const name = piece.displayTitle || piece.title;
  const description = String(piece.caption || piece.breakdown || `${name} is a portfolio project by David Grimsley.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  const url = joinUrl(SITE_URL, `/portfolio/${category}/${encodeURIComponent(piece.title)}`);
  const imageUrl = toAbsoluteUrl(piece.picture || DEFAULT_OG_IMAGE_PATH);

  return {
    title: `${name} | ${SITE_NAME}`,
    description,
    robots: 'index, follow',
    alternates: { canonical: url },
    openGraph: {
      title: `${name} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      images: imageUrl ? [imageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | ${SITE_NAME}`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
