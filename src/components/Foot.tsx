import React from 'react';
import { View, Text } from 'react-native';

export function Foot() {
    return (
        <View className="footer">
            <Text className="footer-text">
                Contact me at: <a href="mailto:DavidJGrimsley@Gmail.com">DavidJGrimsley@Gmail.com</a>
            </Text >
            <Text className="footer-text">Made by David 'Mr. DJ' Grimsley</Text>
        </View>
    );
}
