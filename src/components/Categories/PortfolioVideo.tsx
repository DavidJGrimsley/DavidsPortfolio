import React from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';

export type PortfolioVideoProps = {
  videoId: string;
  title: string;
  width: number;
  height: number;
  onChangeState?: (state: string) => void;
};

export function PortfolioVideo({ title: _title, ...props }: PortfolioVideoProps) {
  return <YoutubePlayer {...props} play={false} />;
}
