import React from 'react';
import { View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { OtherSection } from '@/types/portfolio';
import { ThemedText } from '@/components/UI/ThemedText';
import { relatedProjectHref } from '@/lib/portfolio-links';

type OtherSectionsLinksProps = {
    otherSections?: OtherSection[];
};

export function OtherSectionsLinks({ otherSections }: OtherSectionsLinksProps) {
    if (!otherSections || otherSections.length === 0) {
        return null;
    }

    return (
        <View className="my-[5%] py-[4%] px-[5%] items-center" style={{ borderTopWidth: 2, borderTopColor: 'var(--color-tint)' }}>
            <ThemedText headingLevel={2} className="typo-h2 text-themed mb-[2%]">Related Projects:</ThemedText>
            {otherSections.map((section, index) => (
                <Link
                    key={index} 
                    className="bg-tint py-[3%] px-[5%] rounded-lg my-[1%] w-full max-w-150 items-center"
                    href={relatedProjectHref(section) as Href}
                    accessibilityLabel={section.caption}
                >
                    <ThemedText inverse className="typo-body-semibold text-center">
                        {section.caption} →
                    </ThemedText>
                </Link>
            ))}
        </View>
    );
}
