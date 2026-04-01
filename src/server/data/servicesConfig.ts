import type { ServiceCard } from '@/types/content';

export const CONTENT_VERSION = '2026-03-31.v1';

export const services: ServiceCard[] = [
  {
    id: 'app-development',
    title: 'App Development',
    tagline: 'Cross-platform mobile and web apps',
    description:
      'From idea to launch, I build performant apps with thoughtful UX and maintainable architecture.',
    features: [
      'Expo + React Native implementation',
      'Auth, APIs, and data persistence',
      'Deployment support and iteration plan',
    ],
    primaryCtaLabel: 'Start App Intake',
    primaryCtaId: 'app-development',
    intakeUrl: '/services/app-development',
    accent: '#2563eb',
  },
  {
    id: 'website-building',
    title: 'Website Building',
    tagline: 'Fast, responsive sites with clear messaging',
    description:
      'Business websites, portfolio sites, and landing pages focused on performance, SEO, and conversion.',
    features: [
      'Responsive design for all screens',
      'SEO metadata and structured content',
      'Hosting and deployment guidance',
    ],
    primaryCtaLabel: 'Start Website Intake',
    primaryCtaId: 'website-building',
    intakeUrl: '/services/website-building',
    accent: '#0ea5e9',
  },
  {
    id: 'game-development',
    title: 'Game Development',
    tagline: 'Gameplay systems and polished interactions',
    description:
      'Prototype and production support for game mechanics, UI, and backend integrations.',
    features: [
      'Core gameplay implementation',
      'State management and save systems',
      'Backend/API integration for live features',
    ],
    primaryCtaLabel: 'Start Game Intake',
    primaryCtaId: 'game-development',
    intakeUrl: '/services/game-development',
    accent: '#8b5cf6',
  },
  {
    id: 'tutoring',
    title: 'Tutoring',
    tagline: 'Practical coding guidance',
    description:
      'One-on-one sessions for React, React Native, APIs, and full-stack fundamentals with project-first coaching.',
    features: [
      'Live debugging and code walkthroughs',
      'Learning plans based on your goals',
      'Architecture and best-practice reviews',
    ],
    primaryCtaLabel: 'Start Tutoring Intake',
    primaryCtaId: 'tutoring',
    intakeUrl: '/services/tutoring',
    accent: '#10b981',
  },
  {
    id: 'online-presence',
    title: 'Online Presence',
    tagline: 'Unified brand and technical foundation',
    description:
      'Improve discoverability and credibility with cohesive branding, profiles, and technical setup.',
    features: [
      'Profile and platform consistency',
      'Content structure recommendations',
      'Technical setup and optimization',
    ],
    primaryCtaLabel: 'Start Presence Intake',
    primaryCtaId: 'online-presence',
    intakeUrl: '/services/online-presence',
    accent: '#f59e0b',
  },
];

