/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/toaster";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { ffmpegService, VideoFormats } from '@/services/ffmpeg';

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

interface FFmpegLogEvent {
  message: string;
  type?: string;
}

interface FFmpegProgressEvent {
  progress: number;
  time: number;
}

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFormat, setVideoFormat] = useState(VideoFormats.LANDSCAPE);
  const [ready, setReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const cleanupVideoUrl = () => {
      if (videoUrl) {
        console.log("[Cleanup] Revoking URL on unmount:", videoUrl);
        URL.revokeObjectURL(videoUrl);
      }
    };

    return cleanupVideoUrl;
  }, [videoUrl]);

  useEffect(() => {
    console.log("[Video State] Video URL changed:", videoUrl);
    console.log("[Video State] Is creating video:", isCreatingVideo);
  }, [videoUrl, isCreatingVideo]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setTranscriptSegments([]);
      setError(null);
      const fileName = selectedFile.name.length > 50 ? `${selectedFile.name.slice(0, 47)}...` : selectedFile.name;
      toast({
        title: "File selected",
        description: `Selected file: ${fileName}`,
      });
    }
  };

  const handleTranscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!file) {
        toast({
          title: "Error",
          description: "Please select an audio file first",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("audio", file);

      console.log("Sending request to transcribe API...");
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Transcription error:", errorData);
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const data = await response.json();
      console.log("Received transcript data:", data);
      
      if (!data.segments || !Array.isArray(data.segments)) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid transcript format received");
      }

      setTranscriptSegments(data.segments);
      toast({
        title: "Transcription complete",
        description: `Transcribed ${data.segments.length} segments`
      });
      
    } catch (error) {
      console.error("Transcription error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
    const text = transcriptSegments.map(segment => segment.text).join('\n');
    const lines = text.split('\n');
    const transcriptText = lines.map(line => `${line}\n`).join('');
    
    try {
      await navigator.clipboard.writeText(transcriptText);
      toast({
        title: "Copied to clipboard",
        description: "Transcript has been copied in plain text format"
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
    if (!transcriptSegments.length || !file) {
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
      // Initialize FFmpeg if not already loaded
      if (!ffmpegService.isLoaded()) {
        await ffmpegService.load();
      }

      // Create video with subtitles
      const url = await ffmpegService.createVideoWithSubtitles(
        file,
        transcriptSegments,
        (progress) => setProgress(progress),
        videoFormat
      );

      setVideoUrl(url);
      toast({
        title: "Success",
        description: "Video created successfully",
      });
    } catch (error) {
      console.error("Error creating video:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create video",
        variant: "destructive",
      });
    } finally {
      setIsCreatingVideo(false);
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

          {!transcriptSegments.length && (
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

          {transcriptSegments.length > 0 && (
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Label>Video Format</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={videoFormat === VideoFormats.LANDSCAPE ? "default" : "outline"}
                      onClick={() => setVideoFormat(VideoFormats.LANDSCAPE)}
                    >
                      Landscape (16:9)
                    </Button>
                    <Button
                      variant={videoFormat === VideoFormats.TIKTOK ? "default" : "outline"}
                      onClick={() => setVideoFormat(VideoFormats.TIKTOK)}
                    >
                      TikTok (9:16)
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={createVideoWithSubtitles}
                  disabled={isCreatingVideo || !transcriptSegments.length || !!videoUrl}
                >
                  {isCreatingVideo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Video ({progress}%)
                    </>
                  ) : (
                    "Create Video"
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}
      </Card>

      {/* Card 2: Transcript */}
      {transcriptSegments.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Transcript</h2>
            <div className="flex gap-2">
              <Button onClick={handleCopyTranscript} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy Text
              </Button>
              <Button
                onClick={() => setIsCollapsed(!isCollapsed)}
                variant="outline"
                size="sm"
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Expand
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Collapse
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {isCollapsed ? (
              <p className="whitespace-pre-wrap">
                {transcriptSegments.map(segment => segment.text.trim()).join('').substring(0, 200)}...
              </p>
            ) : (
              <div className="space-y-2">
                {transcriptSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="border-b last:border-b-0 py-2"
                  >
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </div>
                    <p className="flex-1 whitespace-pre-wrap">{segment.text.trim()}</p>
                  </div>
                ))}
              </div>
            )}
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
                {progress}{'%'} - Creating video with subtitles...
              </p>
            </div>
          ) : (
            videoUrl && (
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
            )
          )}
        </Card>
      )}
    </div>
  );
}
