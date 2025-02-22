"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";

export default function VideoPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !imageFile || !subtitleFile) {
      setError("Please select all required files.");
      return;
    }

    setLoading(true);
    setError(null);
    setVideoURL(null);

    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("image", imageFile);
    formData.append("subtitles", subtitleFile);

    try {
      const res = await fetch('/api/generate-video', {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    } else {
      setter(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Video</CardTitle>
          <CardDescription>
            Generate a video by uploading an audio file, an image, and subtitles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audio">Audio file (mp3, etc.)</Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange(setAudioFile)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image file (png, jpg)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange(setImageFile)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitles">Subtitle file (.srt)</Label>
                <Input
                  id="subtitles"
                  type="file"
                  accept=".srt"
                  onChange={handleFileChange(setSubtitleFile)}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                'Generate Video'
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {videoURL && (
            <div className="mt-8 space-y-4">
              <CardTitle className="text-xl">Your Generated Video</CardTitle>
              <video 
                controls 
                src={videoURL} 
                className="w-full rounded-lg shadow-lg"
              />
              <Button asChild className="w-full">
                <a href={videoURL} download="generated-video.mp4">
                  Download Video
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
