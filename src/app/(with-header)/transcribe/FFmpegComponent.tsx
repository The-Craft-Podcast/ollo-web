import { useEffect, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';

console.log('FFmpegComponent: Initializing FFmpeg');
const ffmpeg = new FFmpeg();

const FFmpegComponent = () => {
  const [ready, setReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');

  const load = async () => {
    console.log('FFmpegComponent: Loading FFmpeg');
    await ffmpeg.load();
    setReady(true);
    console.log('FFmpegComponent: FFmpeg loaded');
  };

  useEffect(() => {
    console.log('FFmpegComponent: useEffect triggered');
    load();
  }, []);

  const processVideo = async (file) => {
    console.log('FFmpegComponent: Processing video');
    const data = await file.arrayBuffer();
    await ffmpeg.writeFile('input.mp4', new Uint8Array(data));
    console.log('FFmpegComponent: Video file written');
    await ffmpeg.exec(['-i', 'input.mp4', 'output.mp4']);
    console.log('FFmpegComponent: Video processing complete');
    const output = await ffmpeg.readFile('output.mp4');
    const url = URL.createObjectURL(new Blob([output.buffer], { type: 'video/mp4' }));
    setVideoSrc(url);
    console.log('FFmpegComponent: Video source set');
  };

  return ready ? (
    <div>
      <input type="file" onChange={(e) => processVideo(e.target.files[0])} />
      {videoSrc && <video src={videoSrc} controls />}
    </div>
  ) : (
    <p>Loading...</p>
  );
};

export default FFmpegComponent;
