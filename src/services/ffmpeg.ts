'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { TranscriptSegment } from '@/app/(with-header)/transcribe/page';

interface VideoFormat {
  width: number;
  height: number;
  name: 'landscape' | 'tiktok';
}

export const VideoFormats = {
  LANDSCAPE: { width: 1920, height: 1080, name: 'landscape' as const },
  TIKTOK: { width: 1080, height: 1920, name: 'tiktok' as const }
} as const;

class FFmpegService {
  private static instance: FFmpegService;
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;

  private constructor() {}

  static getInstance(): FFmpegService {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  async load() {
    if (this.loaded) return;

    try {
      console.log('FFmpegService: Creating new FFmpeg instance');
      this.ffmpeg = new FFmpeg();
      
      console.log('FFmpegService: Loading FFmpeg core');
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      this.loaded = true;
      console.log('FFmpegService: FFmpeg loaded successfully');
    } catch (error) {
      console.error('FFmpegService: Error loading FFmpeg:', error);
      throw error;
    }
  }

  private async writeFileToFFmpeg(fileName: string, data: ArrayBuffer | Blob | File) {
    try {
      console.log(`FFmpegService: Writing file ${fileName}`);
      if (data instanceof File || data instanceof Blob) {
        await this.ffmpeg!.writeFile(fileName, await fetchFile(data));
      } else {
        await this.ffmpeg!.writeFile(fileName, new Uint8Array(data));
      }
      console.log(`FFmpegService: Successfully wrote ${fileName}`);
    } catch (error) {
      console.error(`FFmpegService: Error writing ${fileName}:`, error);
      throw error;
    }
  }

  private async cleanupFiles(files: string[]) {
    for (const file of files) {
      try {
        await this.ffmpeg!.deleteFile(file);
        console.log(`FFmpegService: Deleted file ${file}`);
      } catch (error) {
        console.warn(`FFmpegService: Error deleting file ${file}:`, error);
      }
    }
  }

  async createVideoWithSubtitles(
    audioFile: File, 
    transcriptSegments: TranscriptSegment[], 
    onProgress?: (progress: number) => void,
    format: VideoFormat = VideoFormats.LANDSCAPE
  ) {
    if (!this.ffmpeg || !this.loaded) {
      throw new Error('FFmpeg not loaded');
    }

    const filesToCleanup = ['background.png', 'audio.mp3', 'font.ttf', 'output.mp4'];

    try {
      // Clean up any existing files first
      await this.cleanupFiles(filesToCleanup);

      console.log(`FFmpegService: Starting video creation in ${format.name} format`);
      
      // Create canvas for background
      const canvas = document.createElement('canvas');
      canvas.width = format.width;
      canvas.height = format.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Draw black background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const backgroundBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Write files to FFmpeg filesystem
      console.log('FFmpegService: Writing files to FFmpeg filesystem');
      await this.writeFileToFFmpeg('background.png', backgroundBlob);
      await this.writeFileToFFmpeg('audio.mp3', audioFile);

      // Load and write font file
      console.log('FFmpegService: Fetching and writing font file');
      const fontResponse = await fetch('/fonts/Arial.ttf');
      if (!fontResponse.ok) {
        throw new Error(`Failed to fetch font file: ${fontResponse.statusText}`);
      }
      const fontData = await fontResponse.arrayBuffer();
      await this.writeFileToFFmpeg('font.ttf', fontData);

      // Create filter complex
      console.log('FFmpegService: Creating filter complex');
      const textFilters = transcriptSegments.map((segment) => {
        const words = segment.text.split(' ');
        const lines: string[] = [];
        let currentLine: string[] = [];
        let currentLength = 0;

        // Adjust line length based on format
        const maxLineLength = format.name === 'tiktok' ? 60 : 100;

        for (const word of words) {
          if (currentLength + word.length > maxLineLength) {
            lines.push(currentLine.join(' '));
            currentLine = [word];
            currentLength = word.length;
          } else {
            currentLine.push(word);
            currentLength += word.length + 1;
          }
        }
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }

        const escapedText = lines
          .map(line => 
            line
              .replace(/\\/g, "\\\\\\\\")
              .replace(/'/g, "'\\\\\\''")
              .replace(/[\[\](){}]/g, "\\\\$&")
              .replace(/:/g, "\\\\:")
              .replace(/,/g, "\\\\,")
          )
          .join('\\\n');

        const lineCount = lines.length;
        const lineHeight = format.name === 'tiktok' ? 12 : 10; // Slightly larger line height for TikTok
        const yOffset = (lineCount * lineHeight) / 2;
        const boxBorderSize = format.name === 'tiktok' ? 10 : 8; // Larger border for TikTok
        const fontSize = format.name === 'tiktok' ? 44 : 36; // Larger font for TikTok
        
        return `drawtext=fontfile=font.ttf:` +
               `text='${escapedText}':` +
               `fontsize=${fontSize}:` +
               `fontcolor=white:` +
               `box=1:` +
               `boxcolor=black@0.85:` +
               `boxborderw=${boxBorderSize}:` +
               `x=(w-text_w)/2:` +
               `y=(h*0.8)-${yOffset}:` + // Position text lower for TikTok
               `line_spacing=${lineHeight}:` +
               `enable='between(t,${segment.start},${segment.end})'`;
      });

      const filterComplex = textFilters.join(',');
      const duration = Math.ceil(transcriptSegments[transcriptSegments.length - 1].end);

      // Set up progress handling
      if (onProgress) {
        this.ffmpeg.on('progress', ({ progress }) => {
          onProgress(Math.round(progress * 100));
        });
      }

      // Create video
      console.log('FFmpegService: Starting FFmpeg execution');
      const command = [
        '-loop', '1',
        '-t', duration.toString(),
        '-i', 'background.png',
        '-i', 'audio.mp3',
        '-filter_complex',
        `[0:v]scale=${format.width}:${format.height},format=yuv420p[bg];[bg]${filterComplex}[v]`,
        '-map', '[v]',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-shortest',
        '-y',
        'output.mp4'
      ];
      
      console.log('FFmpegService: FFmpeg command:', command.join(' '));
      
      // Execute FFmpeg command
      try {
        await this.ffmpeg.exec(command);
      } catch (error) {
        console.error('FFmpegService: FFmpeg execution error:', error);
        throw error;
      }

      // Read output file
      console.log('FFmpegService: Reading output file');
      const output = await this.ffmpeg.readFile('output.mp4');
      
      console.log('FFmpegService: Creating output URL');
      const data = output instanceof Uint8Array ? output : new TextEncoder().encode(output);
      const url = URL.createObjectURL(
        new Blob([data], { type: 'video/mp4' })
      );
      
      console.log('FFmpegService: Video creation completed successfully');
      
      // Clean up files
      await this.cleanupFiles(filesToCleanup);
      
      return url;
    } catch (error) {
      console.error('FFmpegService: Error in video creation:', error);
      // Attempt to clean up on error
      await this.cleanupFiles(filesToCleanup);
      throw error;
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

export const ffmpegService = FFmpegService.getInstance();
