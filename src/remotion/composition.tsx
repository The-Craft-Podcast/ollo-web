import React, { useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { loadFont } from '@remotion/google-fonts/Roboto';

const { fontFamily } = loadFont();

export const CompositionProps = z.object({
  audioPath: z.string(),
  subtitlesPath: z.string(),
});

type Subtitle = {
  text: string;
  start: number;
  end: number;
};

export const VideoComposition = ({ audioPath, subtitlesPath }: z.infer<typeof CompositionProps>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);

  useEffect(() => {
    const loadSubtitles = async () => {
      try {
        const response = await fetch(subtitlesPath);
        const data = await response.json();
        setSubtitles(data);
      } catch (error) {
        console.error('Failed to load subtitles:', error);
      }
    };
    loadSubtitles();
  }, [subtitlesPath]);

  const currentTime = frame / fps;

  const currentSubtitles = useMemo(() => {
    return subtitles.filter(
      (subtitle) => currentTime >= subtitle.start && currentTime <= subtitle.end
    );
  }, [subtitles, currentTime]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'black',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Audio src={audioPath} />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: 'white',
          fontFamily,
          fontSize: '32px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          width: '80%',
        }}
      >
        {currentSubtitles.map((subtitle) => (
          <div key={subtitle.start}>{subtitle.text}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};