import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { PortfolioVideo } from './PortfolioVideo';
import { Highlight } from '@/types/portfolio';
import { HighlightImageCarousel } from './HighlightImageCarousel';
import { ThemedText } from '@/components/UI/ThemedText';

type HighlightViewProps = {
    highlights: Highlight[];
};

export function HighlightView({ highlights }: HighlightViewProps) {
    const { width } = useWindowDimensions();
    const videoWidth = Math.min(960, Math.max(160, width * 0.8 - 48));
    return (
        <View>
            {highlights.map((highlight, index) => (
                <View key={index} className="highlight-view">
                    <ThemedText headingLevel={2} className="highlight-title">{highlight.highlightTitle}</ThemedText>
                    <View className="w-full flex items-center justify-center flex-row flex-wrap">
                        {highlight.highlightPictures && Array.isArray(highlight.highlightPictures) && highlight.highlightPictures.length > 0 && (
                            <HighlightImageCarousel pictures={highlight.highlightPictures} descriptions={highlight.highlightPictureDescriptions} title={highlight.highlightTitle} />
                        )}
                        {highlight.highlightCaption && (
                            <ThemedText className="highlight-caption">{highlight.highlightCaption}</ThemedText>
                        )}
                    </View>
                    <ThemedText className="highlight-description">{highlight.description}</ThemedText>
                    {highlight.video && (
                        <PortfolioVideo
                            height={videoWidth * 0.5625}
                            width={videoWidth}
                            videoId={highlight.video}
                            title={highlight.highlightTitle}
                        />
                    )}
                    {highlight.code && (
                        <View className="rounded-xl p-[2%] my-[2%] w-[90%] max-w-200 self-center" style={{ backgroundColor: 'var(--color-code-bg)', borderWidth: 1, borderColor: 'var(--color-code-border)' }}>
                            <ThemedText className="typo-code">{highlight.code}</ThemedText>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
}
