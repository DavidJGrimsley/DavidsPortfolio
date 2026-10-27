import React from 'react';
import type { PortfolioVideoProps } from './PortfolioVideo';

// The native player expects a ReactNativeWebView message bridge. A regular
// browser uses YouTube's embed directly and loads it only near the viewport.
export function PortfolioVideo({ videoId, title }: PortfolioVideoProps) {
  return (
    <div style={{ width: '100%', maxWidth: 960, aspectRatio: '16 / 9' }}>
      <iframe
        title={`${title} video`}
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ border: 0, width: '100%', height: '100%', borderRadius: 8 }}
      />
    </div>
  );
}
