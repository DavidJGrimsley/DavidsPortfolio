import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';

export function InProgress() { 
    return (
        <View className="notice">
            <ThemedText inverse className="notice-text">
                ⚠️ This portfolio piece is still in progress. I'm working around the clock to get my projects updated and continually polishing when I can. Check back regularly for updates! ⚠️
            </ThemedText>
        </View>
    );
}
