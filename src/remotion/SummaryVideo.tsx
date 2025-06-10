import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Audio,
  Img,
  staticFile
} from 'remotion';
import { YouTubeVideoData, VideoSummaryData } from '../services/youtubeService';

interface SummaryVideoProps {
  videoData: YouTubeVideoData;
  aiSummary: VideoSummaryData;
  audioUrl?: string;
}

export const SummaryVideo: React.FC<SummaryVideoProps> = ({
  videoData,
  aiSummary,
  audioUrl
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate segment durations
  const introDuration = 8 * fps; // 8 seconds
  const keyPointDuration = Math.floor((42 * fps) / aiSummary.keyPoints.length); // Divide 42 seconds among key points
  const conclusionStart = 50 * fps; // Start conclusion at 50 seconds
  const conclusionDuration = 10 * fps; // 10 seconds

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e293b' }}>
      {/* Background Gradient */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 100%)',
        }}
      />

      {/* Audio Track */}
      {audioUrl && (
        <Audio src={audioUrl} />
      )}

      {/* Intro Sequence (0-8 seconds) */}
      <Sequence from={0} durationInFrames={introDuration}>
        <IntroScene videoData={videoData} />
      </Sequence>

      {/* Key Points Sequences */}
      {aiSummary.keyPoints.map((point, index) => {
        const startFrame = introDuration + (index * keyPointDuration);
        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={keyPointDuration}
          >
            <KeyPointScene
              point={point}
              index={index}
              total={aiSummary.keyPoints.length}
              difficulty={aiSummary.difficulty}
              sentiment={aiSummary.sentiment}
            />
          </Sequence>
        );
      })}

      {/* Conclusion Sequence (50-60 seconds) */}
      <Sequence from={conclusionStart} durationInFrames={conclusionDuration}>
        <ConclusionScene
          videoData={videoData}
          aiSummary={aiSummary}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const IntroScene: React.FC<{ videoData: YouTubeVideoData }> = ({ videoData }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const thumbnailScale = spring({
    frame: frame - 15,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
    },
  });

  return (
    <AbsoluteFill style={{ padding: 80 }}>
      {/* Main Title */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          right: '10%',
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          {videoData.title}
        </h1>
        <p
          style={{
            fontSize: 36,
            color: '#cbd5e1',
            textAlign: 'center',
            marginBottom: 10,
          }}
        >
          by {videoData.channelTitle}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: '#94a3b8',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              padding: '8px 16px',
              borderRadius: 20,
            }}
          >
            {Math.floor(videoData.duration / 60)}:{(videoData.duration % 60).toString().padStart(2, '0')} original
          </span>
          <span
            style={{
              fontSize: 24,
              color: '#94a3b8',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              padding: '8px 16px',
              borderRadius: 20,
            }}
          >
            1:00 summary
          </span>
        </div>
      </div>

      {/* Thumbnail */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '50%',
          transform: `translateX(-50%) scale(${thumbnailScale})`,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Img
          src={videoData.thumbnail}
          style={{
            width: 480,
            height: 270,
            objectFit: 'cover',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const KeyPointScene: React.FC<{
  point: string;
  index: number;
  total: number;
  difficulty: string;
  sentiment: string;
}> = ({ point, index, total, difficulty, sentiment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const progressWidth = interpolate(frame, [0, 60], [0, ((index + 1) / total) * 100], {
    extrapolateRight: 'clamp',
  });

  const slideIn = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
    },
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#eab308';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSentimentColor = (sent: string) => {
    switch (sent) {
      case 'positive': return '#22c55e';
      case 'negative': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  return (
    <AbsoluteFill style={{ padding: 80 }}>
      {/* Key Point Number */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          opacity: textOpacity,
          transform: `translateX(${(1 - slideIn) * -100}px)`,
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#3b82f6',
            marginBottom: 20,
          }}
        >
          Key Point {index + 1}
        </h2>
        <div style={{ display: 'flex', gap: 15, marginBottom: 30 }}>
          <span
            style={{
              fontSize: 18,
              color: getDifficultyColor(difficulty),
              backgroundColor: `${getDifficultyColor(difficulty)}20`,
              padding: '6px 12px',
              borderRadius: 15,
              textTransform: 'capitalize',
            }}
          >
            {difficulty}
          </span>
          <span
            style={{
              fontSize: 18,
              color: getSentimentColor(sentiment),
              backgroundColor: `${getSentimentColor(sentiment)}20`,
              padding: '6px 12px',
              borderRadius: 15,
              textTransform: 'capitalize',
            }}
          >
            {sentiment}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '10%',
          right: '10%',
          opacity: textOpacity,
          transform: `translateY(${(1 - slideIn) * 50}px)`,
        }}
      >
        <p
          style={{
            fontSize: 42,
            color: 'white',
            lineHeight: 1.4,
            textAlign: 'left',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: 40,
            borderRadius: 20,
            backdropFilter: 'blur(10px)',
          }}
        >
          {point}
        </p>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '10%',
          right: '10%',
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
          }}
        >
          <span style={{ fontSize: 24, color: '#cbd5e1' }}>
            Progress: {index + 1} of {total}
          </span>
          <span style={{ fontSize: 24, color: '#cbd5e1' }}>
            {Math.round(((index + 1) / total) * 100)}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressWidth}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ConclusionScene: React.FC<{
  videoData: YouTubeVideoData;
  aiSummary: VideoSummaryData;
}> = ({ videoData, aiSummary }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const bounce = spring({
    frame: frame - 30,
    fps,
    config: {
      damping: 100,
      stiffness: 300,
    },
  });

  return (
    <AbsoluteFill style={{ padding: 80 }}>
      {/* Main Title */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: fadeIn,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#22c55e',
            marginBottom: 20,
          }}
        >
          Summary Complete!
        </h1>
        <p
          style={{
            fontSize: 36,
            color: '#cbd5e1',
            marginBottom: 30,
          }}
        >
          Main topics covered: {aiSummary.mainTopics.join(', ')}
        </p>
      </div>

      {/* Call to Action */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translateX(-50%) scale(${bounce})`,
          textAlign: 'center',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          padding: 40,
          borderRadius: 20,
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
        }}
      >
        <p
          style={{
            fontSize: 32,
            color: 'white',
            marginBottom: 20,
          }}
        >
          Watch the full {Math.floor(videoData.duration / 60)}-minute video
        </p>
        <p
          style={{
            fontSize: 24,
            color: '#cbd5e1',
          }}
        >
          for complete details and examples
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 40,
          opacity: fadeIn,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#3b82f6',
            }}
          >
            {aiSummary.keyPoints.length}
          </div>
          <div style={{ fontSize: 18, color: '#cbd5e1' }}>Key Points</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#8b5cf6',
            }}
          >
            60s
          </div>
          <div style={{ fontSize: 18, color: '#cbd5e1' }}>Summary</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#22c55e',
              textTransform: 'capitalize',
            }}
          >
            {aiSummary.sentiment}
          </div>
          <div style={{ fontSize: 18, color: '#cbd5e1' }}>Tone</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};