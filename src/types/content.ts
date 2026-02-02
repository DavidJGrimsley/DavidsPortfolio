export type ServiceCard = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  primaryCtaLabel: string;
  primaryCtaId: string;
  intakeUrl: string;
  accent: string;
};

export type ContentPayload = {
  version: string;
  generatedAt: string;
  services: ServiceCard[];
};
