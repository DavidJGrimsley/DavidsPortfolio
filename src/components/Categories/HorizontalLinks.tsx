import React from 'react';
import { View, Text, Pressable } from 'react-native';

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
                    <Text className="btn-primary-text">Github</Text>
                </Pressable>
            )}
            {site && (
                <Pressable className="btn-primary" onPress={() => window.open(site)}>
                    <Text className="btn-primary-text">Info Website</Text>
                </Pressable>
            )}
            {steam && (
                <Pressable className="btn-primary" onPress={() => window.open(steam)}>
                    <Text className="btn-primary-text">See it here!</Text>
                </Pressable>
            )}
        </View>
    );
}
