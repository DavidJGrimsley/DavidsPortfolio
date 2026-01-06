import React from 'react';
import { View, Text } from 'react-native';

export function Foot() {
    return (
        <View className="border-[0.2%] border-accent min-h-[5%] m-[1%] p-[1.5%] rounded-[0.5%] items-center justify-center w-[90%] max-w-150 self-center">
            <Text className="text-accent text-[1.4%] text-center">
                Contact me at: <a href="mailto:DavidJGrimsley@Gmail.com">DavidJGrimsley@Gmail.com</a>
            </Text >
            <Text className="text-accent text-[1.4%] text-center">Made by David 'Mr. DJ' Grimsley</Text>
        </View>
    );
}
