"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface TranscriptSegment {
  start_time: number;
  end_time: number;
  speaker: string;
  text: string;
}

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranscript([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to transcribe audio");
      }

      if (!data.segments || !Array.isArray(data.segments)) {
        throw new Error("Invalid response format from server");
      }

      setTranscript(data.segments);
      toast({
        title: "Success",
        description: "Audio transcribed successfully!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transcribe audio";
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

  const copyToClipboard = async () => {
    if (!transcript.length) return;

    const formattedTranscript = transcript
      .map(
        (segment) =>
          `Start time: ${segment.start_time.toFixed(3)}\n` +
          `End time: ${segment.end_time.toFixed(3)}\n` +
          `Speaker: ${segment.speaker}\n` +
          `Text: ${segment.text}\n`
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(formattedTranscript);
      toast({
        title: "Success",
        description: "Transcript copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Toaster />
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Audio Transcription</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {transcript.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Transcript</h2>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </Button>
            </div>
            <div className="bg-muted rounded-lg p-6 space-y-4">
              {transcript.map((segment, index) => (
                <div
                  key={`${segment.start_time}-${index}`}
                  className="border-b border-border last:border-b-0 pb-4 last:pb-0"
                >
                  <div className="text-sm text-muted-foreground">
                    <span className="mr-4">Start: {segment.start_time.toFixed(3)}s</span>
                    <span className="mr-4">End: {segment.end_time.toFixed(3)}s</span>
                    <span className="font-medium">{segment.speaker}</span>
                  </div>
                  <p className="mt-1">{segment.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
