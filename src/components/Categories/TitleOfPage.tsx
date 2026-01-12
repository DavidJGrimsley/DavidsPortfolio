import React from 'react';
import { View, Text } from 'react-native';

type TitleOfPageProps = {
    titleA?: string;
    titleB?: string;
};

export function TitleOfPage({ titleA = 'David', titleB = 'Grimsley' }: TitleOfPageProps) {
    return (
        <View className="main-title">
            <Text className="main-title-text">
                {titleA}
                <Text className="main-title-text-span"> {titleB}</Text>
                <Text style={{ position: 'absolute', top: '50%', left: '50%', color: 'var(--color-accent)', zIndex: -1, transform: 'translate(-50%, -50%)', fontWeight: '800', opacity: 0.5, fontSize: 48 }}>
                    {titleA}
                    {titleB}
                </Text>
            </Text>
        </View>
    );
}
