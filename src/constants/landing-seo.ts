import type { Metadata } from 'expo-server';

import { DEFAULT_OG_IMAGE_PATH, SITE_NAME, SITE_URL, joinUrl } from './seo';

const LANDING_PAGES = {
  '/': {
    title: 'Full-stack developer, websites, apps, APIs, and MCP tools | David Grimsley',
    description: 'David Grimsley builds websites, apps, games, APIs, and developer tools. Explore his portfolio, public projects, and services.',
    guide: '/guides/home.md',
  },
  '/portfolio': {
    title: 'Portfolio | David Grimsley',
    description: 'Explore David Grimsley’s mobile apps, websites, games, and software projects, with project details and implementation notes.',
    guide: '/guides/portfolio.md',
  },
  '/portfolio/mobile-apps': {
    title: 'Mobile Apps | David Grimsley',
    description: 'Explore cross-platform mobile app projects built by David Grimsley with React Native and Expo.',
    guide: '/guides/mobile-apps.md',
  },
  '/portfolio/website-development': {
    title: 'Website Development | David Grimsley',
    description: 'Explore websites built by David Grimsley with responsive design, accessibility, and search visibility in mind.',
    guide: '/guides/website-development.md',
  },
  '/portfolio/game-design': {
    title: 'Game Design | David Grimsley',
    description: 'Explore David Grimsley’s games and interactive prototypes, including a playable demo.',
    guide: '/guides/game-design.md',
  },
  '/portfolio/software-development': {
    title: 'Software Development | David Grimsley',
    description: 'Explore APIs, backend work, integrations, and other software projects by David Grimsley.',
    guide: '/guides/software-development.md',
  },
  '/public-facing': {
    title: 'Public Tools: APIs, MCP Servers, Production Apps | David Grimsley',
    description: 'Try public APIs, explore MCP servers, and visit production apps built by David Grimsley.',
    guide: '/guides/public-tools.md',
  },
  '/public-facing/api': {
    title: 'Public APIs | David Grimsley',
    description: 'Explore David Grimsley’s public APIs and open each API page for current documentation, examples, and usage details.',
    guide: '/guides/apis.md',
  },
  '/public-facing/mcp': {
    title: 'MCP Servers | Model Context Protocol | David Grimsley Portfolio',
    description: 'Explore David Grimsley’s MCP servers for app development guidance and Pokémon strategy tools. See each server’s resources and setup details.',
    guide: '/guides/mcp.md',
  },
  '/public-facing/production': {
    title: 'Production Applications | David Grimsley',
    description: 'Try live apps built by David Grimsley and follow links to their source repositories when available.',
    guide: '/guides/production-apps.md',
  },
  '/services': {
    title: 'Services: Websites, Apps, APIs, Tutoring, Games | David Grimsley',
    description: 'Work with David Grimsley on a website, app, API, game, or online presence project. Explore services and start an inquiry.',
    guide: '/guides/services.md',
  },
  '/contact': {
    title: 'Contact | David Grimsley',
    description: 'Contact David Grimsley about a project or question. Find the general contact form, resume, and project inquiry options.',
    guide: '/guides/contact.md',
  },
} as const;

export type LandingPath = keyof typeof LANDING_PAGES;

export function landingSeoProps(pathname: LandingPath) {
  const page = LANDING_PAGES[pathname];
  return { title: page.title, description: page.description, path: pathname };
}

export function landingMetadata(pathname: LandingPath): Metadata {
  const page = LANDING_PAGES[pathname];
  const url = pathname === '/' ? SITE_URL : joinUrl(SITE_URL, pathname);
  const imageUrl = joinUrl(SITE_URL, DEFAULT_OG_IMAGE_PATH);

  return {
    title: page.title,
    description: page.description,
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    alternates: {
      canonical: url,
      types: { 'text/markdown': joinUrl(SITE_URL, page.guide) },
    },
    icons: { other: [{ rel: 'describedby', url: joinUrl(SITE_URL, '/llms.txt') }] },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: imageUrl, width: 1730, height: 909, alt: 'David Grimsley portfolio preview' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [imageUrl],
    },
  };
}
