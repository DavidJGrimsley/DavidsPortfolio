import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";
import { Highlight } from '@/types/portfolio';
import { HighlightImageCarousel } from './HighlightImageCarousel';

type HighlightViewProps = {
    highlights: Highlight[];
};

export function HighlightView({ highlights }: HighlightViewProps) {
    return (
        <View>
            {highlights.map((highlight, index) => (
                <View key={index} className="highlight-view">
                    <Text className="highlight-title">{highlight.highlightTitle}</Text>
                    <View className="flex items-center justify-center flex-row flex-wrap">
                        {highlight.highlightPictures && Array.isArray(highlight.highlightPictures) && highlight.highlightPictures.length > 0 && (
                            <HighlightImageCarousel pictures={highlight.highlightPictures} />
                        )}
                        {highlight.highlightCaption && (
                            <Text className="highlight-caption">{highlight.highlightCaption}</Text>
                        )}
                    </View>
                    <Text className="highlight-description">{highlight.description}</Text>
                    {highlight.video && (
                        <YoutubePlayer
                            height={Dimensions.get('window').width * 0.5 * 0.5625}
                            width={Dimensions.get('window').width * 0.5}
                            play={false}
                            videoId={highlight.video}
                        />
                    )}
                    {highlight.code && (
                        <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 10, marginVertical: 10, borderWidth: 1, borderColor: '#ddd', width: '90%', maxWidth: 800, alignSelf: 'center' }}>
                            <Text style={{ fontFamily: 'Courier New', fontSize: 13, color: '#333', lineHeight: 19 }}>{highlight.code}</Text>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
}
