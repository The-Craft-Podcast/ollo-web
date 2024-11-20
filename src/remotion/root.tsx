import { registerRoot } from '@remotion/renderer';
import { Composition } from 'remotion';
import { VideoComposition } from './composition';
import { VideoFormats } from './config';

// This is a server-side only component, so we don't need "use client"
const RemotionRoot = () => {
  return (
    <>
      {Object.entries(VideoFormats).map(([key, format]) => (
        <Composition
          key={format.name}
          id={`VideoComposition_${format.name}`}
          component={VideoComposition}
          durationInFrames={300}
          fps={format.fps}
          width={format.width}
          height={format.height}
        />
      ))}
    </>
  );
};

registerRoot(RemotionRoot);
