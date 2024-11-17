import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

console.log("=== Starting API Route ===");
console.log("Environment variables:", {
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN ? 'r8_H6...' : 'missing',
  REPLICATE_ENDPOINT: process.env.REPLICATE_ENDPOINT,
  HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN ? 'hf_Nm...' : 'missing',
});

// Initialize the Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Parse the model endpoint into owner/name and version
const [modelPath, version] = process.env.REPLICATE_ENDPOINT?.split(':') || [];
const [owner, name] = modelPath?.split('/') || [];

if (!modelPath || !version || !owner || !name) {
  throw new Error("Invalid REPLICATE_ENDPOINT format. Expected format: owner/name:version");
}

const MAX_RETRIES = 3;
const BACKOFF_FACTOR = 2;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TranscriptSegment {
  start_time: number;
  end_time: number;
  speaker: string;
  text: string;
}

async function runReplicateWithRetry(
  replicate: Replicate,
  audioData: string,
  maxAttempts = 3
): Promise<TranscriptSegment[]> {
  const [modelPath, version] = process.env.REPLICATE_ENDPOINT?.split(':') || [];
  const [owner, name] = modelPath?.split('/') || [];

  // Create a data URL from the base64 audio data
  const dataUrl = `data:audio/mpeg;base64,${audioData}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      
      const prediction = await replicate.predictions.create({
        version: version,
        input: {
          audio_file: dataUrl,
          language_detection_min_prob: 0,
          language_detection_max_tries: 5,
          vad_onset: 0.5,
          vad_offset: 0.363
        }
      });

      console.log('Prediction created:', prediction);

      const finalPrediction = await replicate.wait(prediction);
      console.log('Final prediction:', finalPrediction);

      if (!finalPrediction.output) {
        throw new Error('No output received from Replicate');
      }

      // Extract and combine all segment texts
      const segments = (finalPrediction.output as any).segments || [];
      const formattedSegments: TranscriptSegment[] = segments.map((segment: any) => ({
        start_time: segment.start,
        end_time: segment.end,
        speaker: segment.speaker || 'SPEAKER_00',
        text: segment.text.trim()
      }));

      console.log('Transcription output:', formattedSegments);

      return formattedSegments;
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxAttempts} failed:`, error);

      if (attempt === maxAttempts) {
        throw error;
      }

      const backoffTime = BACKOFF_FACTOR ** attempt * 1000;
      console.log(`Waiting ${backoffTime}ms before next attempt...`);
      await sleep(backoffTime);
    }
  }

  throw new Error('All retry attempts failed');
}

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not configured" },
      { status: 500 }
    );
  }

  if (!process.env.HUGGINGFACE_TOKEN) {
    return NextResponse.json(
      { error: "HUGGINGFACE_TOKEN is not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("=== Processing Upload ===");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    console.log("File converted to base64, length:", base64Audio.length);

    try {
      const output = await runReplicateWithRetry(replicate, base64Audio);
      console.log("Transcription output:", output);

      return NextResponse.json({ segments: output });
    } catch (error: any) {
      console.error("Final transcription error:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      // Check for specific error types
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed. Please check your HuggingFace token." },
          { status: 401 }
        );
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
