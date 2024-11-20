import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { VideoComposition } from './VideoComposition';

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="video-landscape"
        component={VideoComposition}
        durationInFrames={1} // Will be overridden during render
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          audioData: '',
          subtitles: [],
        }}
      />
      <Composition
        id="video-portrait"
        component={VideoComposition}
        durationInFrames={1} // Will be overridden during render
        fps={24}
        width={1080}
        height={1920}
        defaultProps={{
          audioData: '',
          subtitles: [],
        }}
      />
      <Composition
        id="video-square"
        component={VideoComposition}
        durationInFrames={1} // Will be overridden during render
        fps={24}
        width={1080}
        height={1080}
        defaultProps={{
          audioData: '',
          subtitles: [],
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
export default RemotionRoot;
