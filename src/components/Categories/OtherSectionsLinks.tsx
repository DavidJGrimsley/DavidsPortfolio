import React from 'react';
import { View, Pressable } from 'react-native';
import { router, Href } from 'expo-router';
import { OtherSection } from '@/types/portfolio';
import { ThemedText } from '@/components/UI/ThemedText';

type OtherSectionsLinksProps = {
    otherSections?: OtherSection[];
};

export function OtherSectionsLinks({ otherSections }: OtherSectionsLinksProps) {
    if (!otherSections || otherSections.length === 0) {
        return null;
    }

    const handlePress = (category: string, title: string) => {
        const route = `/${category}/${encodeURIComponent(title)}`;
        router.push(route as any);
    };

    return (
        <View className="my-[5%] py-[4%] px-[5%] items-center" style={{ borderTopWidth: 2, borderTopColor: 'var(--color-tint)' }}>
            <ThemedText headingLevel={2} className="typo-h2 text-themed mb-[2%]">Related Projects:</ThemedText>
            {otherSections.map((section, index) => (
                <Pressable 
                    key={index} 
                    className="bg-tint py-[3%] px-[5%] rounded-lg my-[1%] w-full max-w-150 items-center"
                    onPress={() => handlePress(section.category, section.title)}
                >
                    <ThemedText inverse className="typo-body-semibold text-center">
                        {section.caption} →
                    </ThemedText>
                </Pressable>
            ))}
        </View>
    );
}
