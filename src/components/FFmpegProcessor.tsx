'use client';

import { useEffect, useState } from 'react';
import { ffmpegService } from '@/services/ffmpeg';

interface FFmpegProcessorProps {
  onProcessed?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function FFmpegProcessor({ onProcessed, onError }: FFmpegProcessorProps) {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        await ffmpegService.load();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        onError?.(error as Error);
      }
    };

    loadFFmpeg();
  }, [onError]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const url = await ffmpegService.createVideoWithSubtitles(file, []);
      onProcessed?.(url);
    } catch (error) {
      console.error('Error processing video:', error);
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isReady) {
    return <div>Loading FFmpeg...</div>;
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        accept="video/*"
        disabled={isProcessing}
      />
      {isProcessing && <div>Processing video...</div>}
    </div>
  );
}
