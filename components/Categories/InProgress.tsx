import React from 'react';
import { View, Text } from 'react-native';

export function InProgress() { 
    return (
        <View className="bg-accent p-[1%] rounded-[0.5%] m-[1%]">
            <Text className="text-secondary text-center text-[1.2%]">
                ⚠️ This portfolio piece is still in progress. I'm working around the clock to get my projects updated and continually polishing when I can. Check back regularly for updates! ⚠️
            </Text>
        </View>
    );
}
