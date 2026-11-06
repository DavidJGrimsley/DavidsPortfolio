import type { OtherSection, PortfolioLink } from '@/types/portfolio';

export function relatedProjectHref(section: OtherSection): string {
  return section.href ?? `/portfolio/${section.category}/${encodeURIComponent(section.title)}`;
}

export function portfolioExternalLinks({ github, site, steam, links = [] }: {
  github?: string;
  site?: string;
  steam?: string;
  links?: PortfolioLink[];
}): PortfolioLink[] {
  return [
    ...(github ? [{ label: 'GitHub', url: github }] : []),
    ...(site ? [{ label: 'Info Website', url: site }] : []),
    ...(steam ? [{ label: 'See it here!', url: steam }] : []),
    ...links,
  ];
}
