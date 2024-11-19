import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";
import Replicate from "replicate";

console.log("=== Starting API Route ===");
console.log("Environment variables:", {
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
  REPLICATE_ENDPOINT: process.env.REPLICATE_ENDPOINT,
  HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('Missing REPLICATE_API_TOKEN');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!process.env.REPLICATE_ENDPOINT) {
      console.error('Missing REPLICATE_ENDPOINT');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.error('No audio file provided');
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Check file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (audioFile.size > maxSize) {
      console.error('File too large:', audioFile.size, 'bytes');
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    // Check file type
    if (!audioFile.type.startsWith('audio/')) {
      console.error('Invalid file type:', audioFile.type);
      return NextResponse.json(
        { error: "Invalid file type. Please upload an audio file." },
        { status: 400 }
      );
    }

    // Convert audio file to data URL
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${audioFile.type};base64,${base64Audio}`;

    console.log('Making request to Replicate API...');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(process.env.REPLICATE_ENDPOINT as `${string}/${string}` | `${string}/${string}:${string}`, {
      input: {
        audio_file: dataUrl,
      }
    });

    return NextResponse.json(output);

  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
