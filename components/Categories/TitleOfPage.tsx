import React from 'react';
import { View, Text } from 'react-native';

type TitleOfPageProps = {
    titleA?: string;
    titleB?: string;
};

export function TitleOfPage({ titleA = 'Featured', titleB = 'Project' }: TitleOfPageProps) {
    return (
        <View className="text-center pb-[1.2%] pt-[1.2%] px-[1%] -z-10">
            <Text className="relative uppercase text-[4%] font-bold font-[Rubik] text-themed">
                {titleA}
                <Text className="text-secondary"> {titleB}</Text>
                <Text style={{ position: 'absolute', top: '50%', left: '50%', color: 'var(--color-accent)', zIndex: -1, transform: 'translate(-50%, -50%)', fontWeight: '800', opacity: 0.5, fontSize: 48 }}>
                    {titleA}
                    {titleB}
                </Text>
            </Text>
        </View>
    );
}
