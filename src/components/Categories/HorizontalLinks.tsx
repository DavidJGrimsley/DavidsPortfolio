import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { ExternalLink } from '@/components/UI/ExternalLink';
import type { PortfolioLink } from '@/types/portfolio';
import { portfolioExternalLinks } from '@/lib/portfolio-links';

type HorizontalLinksProps = {
    github?: string;
    site?: string;
    steam?: string;
    links?: PortfolioLink[];
};

export function HorizontalLinks(props: HorizontalLinksProps) {
    return (
        <View className="flex-row flex-wrap justify-center items-center gap-3 my-4">
            {portfolioExternalLinks(props).map(({ label, url }) => (
                <ExternalLink key={`${label}-${url}`} href={url} className="bg-accent rounded-lg px-5 py-3 w-full sm:w-auto max-w-full" accessibilityLabel={label}>
                    <ThemedText className="text-center text-base md:text-lg" style={{ color: '#fff' }}>{label}</ThemedText>
                </ExternalLink>
            ))}
        </View>
    );
}
