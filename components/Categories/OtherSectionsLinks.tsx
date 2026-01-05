import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, Href } from 'expo-router';
import { OtherSection } from '@/types/portfolio';

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
        <View style={{ marginVertical: 20, paddingVertical: 15, paddingHorizontal: 20, borderTopWidth: 2, borderTopColor: 'var(--color-tint)', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 10 }}>Related Projects:</Text>
            {otherSections.map((section, index) => (
                <Pressable 
                    key={index} 
                    style={{ backgroundColor: 'var(--color-tint)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginVertical: 5, width: '100%', maxWidth: 600, alignItems: 'center' }}
                    onPress={() => handlePress(section.category, section.title)}
                >
                    <Text style={{ color: 'var(--color-secondary)', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                        {section.caption} →
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}
