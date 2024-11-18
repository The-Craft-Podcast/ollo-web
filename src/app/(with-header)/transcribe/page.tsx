"use client";

import React, { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from '@ffmpeg/util';
import { Loader2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Progress } from "@/components/ui/progress";

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
  compression_ratio?: number;
  no_speech_prob?: number;
  temperature?: number;
}

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Cleanup video URL when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) {
        console.log("[Cleanup] Revoking URL on unmount:", videoUrl);
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    console.log("[Video State] Video URL changed:", videoUrl);
    console.log("[Video State] Is creating video:", isCreatingVideo);
  }, [videoUrl, isCreatingVideo]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setTranscript([]);
      setError(null);
      toast({
        title: "File selected",
        description: `Selected file: ${selectedFile.name}`,
      });
    }
  };

  const handleTranscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const formData = new FormData();
      if (!file) return;
      formData.append("file", file);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await response.json();
      console.log("Received transcript data:", data);
      
      if (!data.segments || !Array.isArray(data.segments)) {
        throw new Error("Invalid transcript format received");
      }

      setTranscript(data.segments);
      toast({
        title: "Transcription complete",
        description: `Transcribed ${data.segments.length} segments`
      });
      
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to transcribe audio");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const handleCopyTranscript = async () => {
    const transcriptText = transcript.map(segment => 
      `${formatTime(segment.start)} --> ${formatTime(segment.end)}\n${segment.text}\n`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(transcriptText);
      toast({
        title: "Copied to clipboard",
        description: "Transcript has been copied in subtitle format"
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy transcript to clipboard",
        variant: "destructive"
      });
    }
  };

  const createVideoWithSubtitles = async () => {
    console.log("[Video Creation] Starting video creation process");
    console.log("[Video Creation] Current video URL:", videoUrl);
    console.log("[Video Creation] Current creating state:", isCreatingVideo);
    
    if (!transcript.length) {
      console.log("[Video Creation] Error: No transcript available");
      toast({
        title: "Error",
        description: "Please upload an audio file and generate transcript first",
      });
      return;
    }

    setProgress(0);
    setIsCreatingVideo(true);
    setVideoUrl(null);
    
    try {
      // Create canvas for background
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Draw black background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Convert canvas to image
      const backgroundBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      console.log("[Video Creation] Created background image");

      // Initialize FFmpeg with logging
      const ffmpeg = new FFmpeg();
      console.log("[Video Creation] Loading FFmpeg");

      // Load FFmpeg with local files and enable logging
      await ffmpeg.load({
        coreURL: '/ffmpeg-core.js',
        wasmURL: '/ffmpeg-core.wasm',
        log: true
      });

      // Add log callback
      ffmpeg.on('log', ({ message }) => {
        console.log("[FFmpeg]", message);
      });

      // Add progress callback
      ffmpeg.on('progress', ({ progress: p }) => {
        // progress is a float between 0 and 1
        setProgress(Math.round(p * 100));
      });

      console.log("[Video Creation] FFmpeg loaded");

      // Load and write font file to FFmpeg filesystem
      const fontResponse = await fetch('/fonts/Arial.ttf');
      const fontData = await fontResponse.arrayBuffer();
      await ffmpeg.writeFile('font.ttf', new Uint8Array(fontData));
      console.log("[Video Creation] Font file written to filesystem");

      // Write background image and audio to FFmpeg virtual filesystem
      await ffmpeg.writeFile('background.png', await fetchFile(backgroundBlob));
      console.log("[Video Creation] Background image written to filesystem");

      // Get audio file from the input element
      const audioFile = document.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0];
      if (!audioFile) {
        throw new Error("No audio file found");
      }
      await ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));
      console.log("[Video Creation] Audio file written to filesystem");

      // Create filter complex with timed text overlays
      const textFilters = transcript.map((segment, index) => {
        // Break text into wider lines (around 100 chars each)
        const words = segment.text.split(' ');
        let lines = [];
        let currentLine = [];
        let currentLength = 0;

        for (const word of words) {
          if (currentLength + word.length > 100) {
            lines.push(currentLine.join(' '));
            currentLine = [word];
            currentLength = word.length;
          } else {
            currentLine.push(word);
            currentLength += word.length + 1; // +1 for space
          }
        }
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }

        // Properly escape special characters for FFmpeg
        const escapedText = lines
          .map(line => 
            line
              .replace(/\\/g, "\\\\\\\\") // Escape backslashes first
              .replace(/'/g, "'\\\\\\''") // Escape single quotes
              .replace(/[\[\](){}]/g, "\\\\$&") // Escape brackets
              .replace(/:/g, "\\\\:") // Escape colons
              .replace(/,/g, "\\\\,") // Escape commas
          )
          .join('\\\n'); // Double-escaped newline for FFmpeg

        // Calculate y position to center text vertically
        const lineCount = lines.length;
        const lineHeight = 10;
        const yOffset = (lineCount * lineHeight) / 2;
        const boxBorderSize = 8; // Add some padding around the text
        
        // Create drawtext filter with improved text box and positioning
        return `drawtext=fontfile=font.ttf:` +
               `text='${escapedText}':` +
               `fontsize=36:` + // Increased font size
               `fontcolor=white:` +
               `box=1:` +
               `boxcolor=black@0.85:` + // More opaque background
               `boxborderw=${boxBorderSize}:` +
               `x=(w-text_w)/2:` +
               `y=(h/2)-${yOffset}:` + // Centered vertically
               `line_spacing=${lineHeight}:` + // Increased line spacing
               `enable='between(t,${segment.start},${segment.end})'`;
      });

      const filterComplex = textFilters.join(',');
      console.log("[Video Creation] Filter complex:", filterComplex);

      // Calculate video duration from last segment
      const duration = Math.ceil(transcript[transcript.length - 1].end);
      console.log("[Video Creation] Video duration:", duration);

      // Create video with text overlay and audio
      const command = [
        '-loop', '1',
        '-i', 'background.png',
        '-i', 'audio.mp3',
        '-t', duration.toString(),
        '-vf', filterComplex,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-f', 'mp4',
        '-movflags', '+faststart',
        '-y',
        'output.mp4'
      ];
      
      console.log("[Video Creation] FFmpeg command:", command.join(' '));
      await ffmpeg.exec(command);

      console.log("[Video Creation] Video processing complete");

      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      console.log("[Video Creation] Output file size:", data.length, "bytes");
      
      const videoBlob = new Blob([data], { type: 'video/mp4' });
      console.log("[Video Creation] Video blob created:", {
        size: videoBlob.size,
        type: videoBlob.type
      });
      
      // Cleanup old URL if it exists
      if (videoUrl) {
        console.log("[Video Creation] Cleaning up old URL:", videoUrl);
        URL.revokeObjectURL(videoUrl);
      }

      // Create new video URL
      const url = URL.createObjectURL(videoBlob);
      console.log("[Video Creation] Created new URL:", url);
      
      setVideoUrl(url);
      console.log("[Video Creation] Set video URL in state");
      
      toast({
        title: "Success",
        description: "Video created successfully",
      });
    } catch (error) {
      console.error("[Video Creation] Error:", error);
      setVideoUrl(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create video",
      });
    } finally {
      console.log("[Video Creation] Cleanup - Setting states");
      console.log("[Video Creation] Final video URL:", videoUrl);
      setIsCreatingVideo(false);
      setProgress(0);
    }
  };

  const handleDownloadVideo = () => {
    console.log("[Download] Starting download process");
    console.log("[Download] Video URL:", videoUrl);
    
    if (!videoUrl) {
      console.log("[Download] No video URL available");
      return;
    }
    
    try {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = 'video.mp4';
      document.body.appendChild(a);
      console.log("[Download] Download element created and appended");
      a.click();
      document.body.removeChild(a);
      console.log("[Download] Download initiated and element cleaned up");
    } catch (error) {
      console.error("[Download] Error during download:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl space-y-6">
      <Toaster />
      
      {/* Card 1: Upload and Controls */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Audio Transcription</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleTranscribe(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audio-file">Upload Audio File</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>

          {!transcript.length && (
            <Button
              type="submit"
              disabled={!file || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Transcribing...</span>
                </div>
              ) : (
                "Transcribe Audio"
              )}
            </Button>
          )}

          {transcript.length > 0 && (
            <Button 
              onClick={createVideoWithSubtitles} 
              disabled={!transcript.length || isCreatingVideo}
              className="w-full"
            >
              {isCreatingVideo ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Creating Video...</span>
                </div>
              ) : (
                "Create Video"
              )}
            </Button>
          )}
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}
      </Card>

      {/* Card 2: Transcript */}
      {transcript.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Transcript</h2>
            <div className="flex gap-2">
              <Button onClick={handleCopyTranscript} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                onClick={() => setIsCollapsed(!isCollapsed)}
                variant="outline"
                size="sm"
              >
                {isCollapsed ? (
                  <React.Fragment key="show-more">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More
                  </React.Fragment>
                ) : (
                  <React.Fragment key="show-less">
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </React.Fragment>
                )}
              </Button>
            </div>
          </div>
          <div className={`space-y-2 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-40' : 'max-h-[800px]'}`}>
            {transcript.map((segment) => (
              <div key={segment.id} className="flex flex-col gap-1 p-2 rounded hover:bg-muted">
                <div className="text-xs text-muted-foreground">
                  {formatTime(segment.start)} --> {formatTime(segment.end)}
                </div>
                <div className="text-sm">{segment.text}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Card 3: Video Output */}
      {(isCreatingVideo || videoUrl) && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Video Output</h2>
            {videoUrl && (
              <Button
                onClick={handleDownloadVideo}
                variant="outline"
                size="sm"
              >
                Download Video
              </Button>
            )}
          </div>
          
          {isCreatingVideo ? (
            <div className="space-y-4">
              <Progress
                value={progress}
                data-testid="video-progress"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground text-center">
                {progress}% - Creating video with subtitles...
              </p>
            </div>
          ) : videoUrl && (
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
                onError={(e) => console.error("[Video Player] Error loading video:", e)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
