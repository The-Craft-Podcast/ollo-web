import { NextRequest, NextResponse } from "next/server";

const CLOUD_FUNCTION_URL = process.env.VIDEO_RENDER_FUNCTION_URL || 
  "https://us-central1-ai-app-mvp-project.cloudfunctions.net/render-video";

class CloudFunctionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudFunctionError";
  }
}

export async function POST(request: NextRequest) {
  console.log('[Video Creation] Starting video creation process');
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const subtitles = formData.get('subtitles') as string;
    const format = formData.get('format') as string || 'landscape';

    if (!audioFile || !subtitles) {
      console.error('[Video Creation] Missing required files or data');
      return NextResponse.json({ error: 'Missing required files or data' }, { status: 400 });
    }

    // Convert audio to base64 for transmission
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Make request to Cloud Function
    console.log('[Video Creation] Sending request to Cloud Function');
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: audioBase64,
        subtitles: JSON.parse(subtitles),
        format,
        filename: audioFile.name,
      })
    });

    if (!response.ok) {
      throw new CloudFunctionError(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.videoUrl) {
      throw new CloudFunctionError('Invalid response from Cloud Function');
    }

    console.log('[Video Creation] Video creation successful');
    return NextResponse.json({ videoUrl: data.videoUrl });
    
  } catch (error) {
    console.error('[Video Creation] Error:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
    } : error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create video' },
      { status: 500 }
    );
  }
}
