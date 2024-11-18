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

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface ReplicateError extends Error {
  response?: {
    status: number;
    statusText: string;
  };
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runReplicateWithRetry(
  replicate: Replicate,
  audioDataUrl: string,
  retryCount = 0
): Promise<any> {
  try {
    console.log("=== Replicate API Call Attempt", retryCount + 1, "===");
    console.log("Audio URL format check:", {
      startsWithData: audioDataUrl.startsWith('data:'),
      containsBase64: audioDataUrl.includes(';base64,'),
      totalLength: audioDataUrl.length,
      preview: audioDataUrl.substring(0, 50) + "..."
    });

    if (!process.env.REPLICATE_ENDPOINT) {
      throw new Error("REPLICATE_ENDPOINT is not configured");
    }

    console.log("Using Replicate model:", process.env.REPLICATE_ENDPOINT);

    const output = await replicate.run(
      process.env.REPLICATE_ENDPOINT,
      {
        input: {
          audio_file: audioDataUrl,
          model: "large-v2",
          transcription: "plain text",
          translate: false,
          temperature: 0,
          suppress_tokens: "-1",
          condition_on_previous_text: false,
          compression_ratio_threshold: 2.4,
          logprob_threshold: -1,
          no_speech_threshold: 0.6,
        },
      }
    );

    console.log("API call successful! Raw output:", output);
    return output;
  } catch (error) {
    const replicateError = error as ReplicateError;
    console.error(`Attempt ${retryCount + 1} failed:`, {
      message: replicateError.message,
      status: replicateError.response?.status,
      statusText: replicateError.response?.statusText,
    });

    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms...`);
      await wait(delay);
      return runReplicateWithRetry(replicate, audioDataUrl, retryCount + 1);
    }

    throw replicateError;
  }
}

export async function POST(request: NextRequest) {
  console.log("=== Starting Transcription Request ===");
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Missing REPLICATE_API_TOKEN");
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("=== Processing Upload ===");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.error("No file provided in request");
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
    console.log("Base64 conversion complete:", {
      originalSize: arrayBuffer.byteLength,
      base64Length: base64Audio.length,
    });

    const audioDataUrl = `data:${file.type};base64,${base64Audio}`;
    console.log("Data URL created:", {
      mimeType: file.type,
      urlPrefix: audioDataUrl.substring(0, 50) + "...",
      totalLength: audioDataUrl.length,
    });

    try {
      const output = await runReplicateWithRetry(replicate, audioDataUrl);
      console.log("Raw Replicate output:", output);

      // Extract segments from the response
      const segments = output.segments || [];
      console.log("Processed segments:", {
        count: segments.length,
        firstSegment: segments[0],
      });

      return NextResponse.json({ segments });
    } catch (error) {
      const replicateError = error as ReplicateError;
      console.error("Final transcription error:", {
        message: replicateError.message,
        status: replicateError.response?.status,
        statusText: replicateError.response?.statusText,
      });
      
      if (replicateError.response?.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed. Please check your HuggingFace token." },
          { status: 401 }
        );
      }
      
      throw replicateError;
    }
  } catch (error) {
    const apiError = error as Error;
    console.error("Request processing error:", apiError);
    return NextResponse.json(
      { error: apiError.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
