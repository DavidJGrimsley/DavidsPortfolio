import React from 'react';
import { View, Text } from 'react-native';

export function InProgress() { 
    return (
        <View className="notice">
            <Text className="notice-text">
                ⚠️ This portfolio piece is still in progress. I'm working around the clock to get my projects updated and continually polishing when I can. Check back regularly for updates! ⚠️
            </Text>
        </View>
    );
}
