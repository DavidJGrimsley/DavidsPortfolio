import React from 'react';
import { View, Dimensions } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";
import { Highlight } from '@/types/portfolio';
import { HighlightImageCarousel } from './HighlightImageCarousel';
import { ThemedText } from '@/components/UI/ThemedText';

type HighlightViewProps = {
    highlights: Highlight[];
};

export function HighlightView({ highlights }: HighlightViewProps) {
    return (
        <View>
            {highlights.map((highlight, index) => (
                <View key={index} className="highlight-view">
                    <ThemedText headingLevel={3} className="highlight-title">{highlight.highlightTitle}</ThemedText>
                    <View className="flex items-center justify-center flex-row flex-wrap">
                        {highlight.highlightPictures && Array.isArray(highlight.highlightPictures) && highlight.highlightPictures.length > 0 && (
                            <HighlightImageCarousel pictures={highlight.highlightPictures} />
                        )}
                        {highlight.highlightCaption && (
                            <ThemedText className="highlight-caption">{highlight.highlightCaption}</ThemedText>
                        )}
                    </View>
                    <ThemedText className="highlight-description">{highlight.description}</ThemedText>
                    {highlight.video && (
                        <YoutubePlayer
                            height={Dimensions.get('window').width * 0.5 * 0.5625}
                            width={Dimensions.get('window').width * 0.5}
                            play={false}
                            videoId={highlight.video}
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
