import React from 'react';
import { View, Text, Pressable } from 'react-native';

type HorizontalLinksProps = {
    github?: string;
    site?: string;
    steam?: string;
};

export function HorizontalLinks({ github, site, steam }: HorizontalLinksProps) {
    return (
        <View className="flex-row justify-center items-center my-[10px]">
            {github && (
                <Pressable className="bg-accent p-[1%] rounded-[1%] m-[1%] w-[20%] self-center" onPress={() => window.open(github)}>
                    <Text className="text-secondary text-center text-[2%]">Github</Text>
                </Pressable>
            )}
            {site && (
                <Pressable className="bg-accent p-[1%] rounded-[1%] m-[1%] w-[20%] self-center" onPress={() => window.open(site)}>
                    <Text className="text-secondary text-center text-[2%]">Info Website</Text>
                </Pressable>
            )}
            {steam && (
                <Pressable className="bg-accent p-[1%] rounded-[1%] m-[1%] w-[20%] self-center" onPress={() => window.open(steam)}>
                    <Text className="text-secondary text-center text-[2%]">See it here!</Text>
                </Pressable>
            )}
        </View>
    );
}
