import React from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';

type IframeEmbedProps = {
    src: string;
};

export function IframeEmbed({ src }: IframeEmbedProps) {
    const isWeb = Platform.OS === 'web';
    
    return isWeb ? (
        <iframe src={src} style={{ height: '85%' }} />
    ) : (
        <WebView
            source={{ uri: src }}
            style={{ height: '85%' }}
        />
    );
}
