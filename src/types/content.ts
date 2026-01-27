export type ServiceCard = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  primaryCtaLabel: string;
  primaryCtaId: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  secondaryCtaIsRoute?: boolean;
  accent: string;
};

export type AdConfig = {
  id: string;
  serviceId: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  accent: string;
  placement?: string;
  tags?: string[];
};

export type ContentPayload = {
  version: string;
  generatedAt: string;
  services: ServiceCard[];
  ads: AdConfig[];
};
