import React from 'react';
import { Platform, View } from 'react-native';
import { A, Footer } from '@expo/html-elements';
import { ThemedText } from '@/components/UI/ThemedText';

export function Foot() {
    const Container = Platform.OS === 'web' ? Footer : View;

    return (
        <Container className="footer">
            <ThemedText className="">
                Contact me at: <A href="mailto:MrDJ@DavidJGrimsley.com">MrDJ@DavidJGrimsley.com</A>
            </ThemedText>
            <ThemedText className="footer-text">Made by David 'Mr. DJ' Grimsley</ThemedText>
        </Container>
    );
}
