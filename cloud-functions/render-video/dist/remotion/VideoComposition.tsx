import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from 'remotion';

type Props = {
  audioData: string; // base64 encoded audio
  subtitles: Array<{
    text: string;
    start: number;
    end: number;
  }>;
};

export const VideoComposition: React.FC<Props> = ({audioData, subtitles}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [handle] = useState(() => delayRender());

  const audioUrl = `data:audio/mp3;base64,${audioData}`;

  useEffect(() => {
    const audioElement = document.createElement('audio');
    audioElement.src = audioUrl;
    audioElement.addEventListener('loadedmetadata', () => {
      continueRender(handle);
    });
    audioElement.addEventListener('error', () => {
      console.error('Error loading audio:', audioElement.error);
      continueRender(handle);
    });
  }, [audioUrl, handle]);

  const currentTime = frame / fps;
  const currentSubtitle = subtitles.find(
    (sub) => currentTime >= sub.start && currentTime <= sub.end
  );

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <Audio src={audioUrl} />
      {currentSubtitle && (
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '10px 20px',
            borderRadius: '5px',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'white',
              fontSize: '24px',
              margin: 0,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
            }}
          >
            {currentSubtitle.text}
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};
