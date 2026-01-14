import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';

export function Foot() {
    return (
        <View className="footer">
            <ThemedText className="footer-text">
                Contact me at: <a href="mailto:DavidJGrimsley@Gmail.com">DavidJGrimsley@Gmail.com</a>
            </ThemedText>
            <ThemedText className="footer-text">Made by David 'Mr. DJ' Grimsley</ThemedText>
        </View>
    );
}
