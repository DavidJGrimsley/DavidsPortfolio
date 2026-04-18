export const SITE_NAME = 'David Grimsley';
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_ORIGIN?.trim() ||
  process.env.EXPO_PUBLIC_SITE_URL?.trim() ||
  'https://davidjgrimsley.com';

export const AUTHOR_NAME = 'David Grimsley';

// Put a real image at this path for rich link previews (1200x630 recommended).
export const DEFAULT_OG_IMAGE_PATH = '/images/icon.png';

export const DEFAULT_DESCRIPTION =
  "David Grimsley builds fast, accessible websites and cross-platform apps. Explore portfolio work, public APIs, and Model Context Protocol (MCP) tools.";

export const DEFAULT_KEYWORDS = [
  'David Grimsley',
  'Mr. DJ',
  'website developer',
  'website building',
  'web development',
  'app developer',
  'React Native developer',
  'Expo',
  'API development',
  'REST API',
  'MCP',
  'Model Context Protocol',
  'AI tools',
  'freelance developer',
];

export function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

export function toAbsoluteUrl(maybePathOrUrl: string | undefined | null): string | undefined {
  if (!maybePathOrUrl) return undefined;
  if (/^https?:\/\//i.test(maybePathOrUrl)) return maybePathOrUrl;
  return joinUrl(SITE_URL, maybePathOrUrl);
}
