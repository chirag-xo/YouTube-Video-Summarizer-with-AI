import React from 'react';
import { Composition } from 'remotion';
import { SummaryVideo } from './SummaryVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SummaryVideo"
        component={SummaryVideo}
        durationInFrames={1800} // 60 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoData: {
            id: 'sample',
            title: 'Sample Video Title',
            description: 'Sample description',
            duration: 300,
            channelTitle: 'Sample Channel',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
            publishedAt: '2023-01-01T00:00:00Z',
            viewCount: 1000000,
            tags: ['sample', 'video']
          },
          aiSummary: {
            summary: 'This is a sample AI-generated summary of the video content.',
            keyPoints: [
              'First key point from the video',
              'Second important insight',
              'Third valuable takeaway',
              'Fourth essential concept',
              'Fifth crucial detail'
            ],
            mainTopics: ['Technology', 'Education', 'Innovation'],
            sentiment: 'positive' as const,
            difficulty: 'intermediate' as const
          }
        }}
      />
    </>
  );
};