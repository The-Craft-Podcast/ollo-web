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
import { Loader2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { VideoFormats } from "@/remotion/config";

export interface TranscriptSegment {
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
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFormat, setVideoFormat] = useState<typeof VideoFormats[keyof typeof VideoFormats]>(VideoFormats.LANDSCAPE);
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  };

  const handleCopyTranscript = async () => {
    const srtContent = transcriptSegments.map((segment, index) => {
      return `${index + 1}\n${formatTime(segment.start)} --> ${formatTime(segment.end)}\n${segment.text}\n`;
    }).join('\n');
    
    try {
      await navigator.clipboard.writeText(srtContent);
      toast({
        title: "Copied to clipboard",
        description: "Transcript has been copied in SRT format"
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
    console.log('[Video Creation Client] Starting video creation process');
    
    if (!transcriptSegments.length || !file) {
      console.warn('[Video Creation Client] Missing required data:', {
        hasTranscriptSegments: transcriptSegments.length > 0,
        hasFile: !!file
      });
      
      toast({
        title: "Error",
        description: "Please upload an audio file and generate transcript first",
        variant: "destructive",
      });
      return;
    }

    setProgress(0);
    setIsCreatingVideo(true);
    setVideoUrl(null);

    try {
      console.log('[Video Creation Client] Preparing data:', {
        audioFileName: file.name,
        audioFileSize: file.size,
        transcriptSegments: transcriptSegments.length,
        videoFormat: videoFormat.name,
      });

      const formData = new FormData();
      formData.append('audio', file);
      formData.append('subtitles', JSON.stringify(transcriptSegments.map(segment => ({
        text: segment.text,
        start: segment.start,
        end: segment.end,
      }))));
      formData.append('format', videoFormat.name);

      console.log('[Video Creation Client] Sending request to API');
      toast({
        title: "Creating Video",
        description: "This may take a few minutes. Please wait...",
      });

      const startTime = Date.now();
      const response = await fetch('/api/create-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Video Creation Client] API Error:', error);
        throw new Error(error.error || 'Failed to create video');
      }

      const { videoUrl } = await response.json();
      console.log('[Video Creation Client] Video created successfully:', {
        videoUrl,
        timeElapsed: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      });
      
      setVideoUrl(videoUrl);
      
      toast({
        title: "Success",
        description: "Video created successfully! Click Download to save.",
      });
    } catch (error) {
      console.error('[Video Creation Client] Error:', error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create video",
        variant: "destructive",
      });
    } finally {
      console.log('[Video Creation Client] Process complete');
      setIsCreatingVideo(false);
      setProgress(100);
    }
  };

  const handleDownloadVideo = () => {
    if (!videoUrl) {
      return;
    }
    
    try {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = 'video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("[Download] Error during download:", error);
      toast({
        title: "Error",
        description: "Failed to download video",
        variant: "destructive",
      });
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
        </form>
      </Card>

      {/* Card 2: Transcript Display */}
      {transcriptSegments.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Transcript</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyTranscript}
                title="Copy transcript"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand transcript" : "Collapse transcript"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transcriptSegments.map((segment, index) => (
                <div key={segment.id} className="text-sm">
                  <span className="text-gray-500">{index + 1}</span>
                  <span className="mx-2">|</span>
                  <span className="text-gray-500">{formatTime(segment.start)}</span>
                  <span className="mx-2">→</span>
                  <span className="text-gray-500">{formatTime(segment.end)}</span>
                  <span className="mx-2">:</span>
                  <span>{segment.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-4">
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
                    variant={videoFormat === VideoFormats.PORTRAIT ? "default" : "outline"}
                    onClick={() => setVideoFormat(VideoFormats.PORTRAIT)}
                  >
                    Portrait (9:16)
                  </Button>
                  <Button
                    variant={videoFormat === VideoFormats.SQUARE ? "default" : "outline"}
                    onClick={() => setVideoFormat(VideoFormats.SQUARE)}
                  >
                    Square (1:1)
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={createVideoWithSubtitles}
              disabled={isCreatingVideo}
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

            {isCreatingVideo && (
              <Progress value={progress} className="w-full" />
            )}

            {videoUrl && (
              <Button
                onClick={handleDownloadVideo}
                variant="outline"
                className="w-full"
              >
                Download Video
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
