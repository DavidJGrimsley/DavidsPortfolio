import React from 'react';
import { View, Pressable } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';

type HorizontalLinksProps = {
    github?: string;
    site?: string;
    steam?: string;
};

export function HorizontalLinks({ github, site, steam }: HorizontalLinksProps) {
    return (
        <View className="flex-row justify-center items-center my-2.5">
            {github && (
                <Pressable className="btn-primary" onPress={() => window.open(github)}>
                    <ThemedText inverse className="btn-primary-text">Github</ThemedText>
                </Pressable>
            )}
            {site && (
                <Pressable className="btn-primary" onPress={() => window.open(site)}>
                    <ThemedText inverse className="btn-primary-text">Info Website</ThemedText>
                </Pressable>
            )}
            {steam && (
                <Pressable className="btn-primary" onPress={() => window.open(steam)}>
                    <ThemedText inverse className="btn-primary-text">See it here!</ThemedText>
                </Pressable>
            )}
        </View>
    );
}
