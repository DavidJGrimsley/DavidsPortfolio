import React from 'react';
import { View, Text } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';

type TitleOfPageProps = {
    titleA?: string;
    titleB?: string;
};

export function TitleOfPage({ titleA = 'David', titleB = 'Grimsley' }: TitleOfPageProps) {
    return (
        <View className="main-title relative">
            <ThemedText
                headingLevel={1}
                visualHeadingLevel={1}
                className="main-title-text"
                aria={`${titleA} ${titleB}`}
            >
                {titleA}
                <Text className="main-title-text-span"> {titleB}</Text>
            </ThemedText>
            <Text
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 text-accent opacity-50 font-extrabold text-5xl"
                accessible={false}
            >
                {titleA} {titleB}
            </Text>
        </View>
    );
}
