import React from 'react';
import { Platform, View } from 'react-native';
import { Footer } from '@expo/html-elements';
import { ThemedText } from '@/components/UI/ThemedText';

export function Foot() {
    const Container = Platform.OS === 'web' ? Footer : View;

    return (
        <Container className="footer">
            <ThemedText className="footer-text">
                Contact me at: <a href="mailto:DavidJGrimsley@Gmail.com">DavidJGrimsley@Gmail.com</a>
            </ThemedText>
            <ThemedText className="footer-text">Made by David 'Mr. DJ' Grimsley</ThemedText>
        </Container>
    );
}
