import * as functions from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, getCompositions } from '@remotion/renderer';
import fs from 'fs';
import os from 'os';
import path from 'path';

const storage = new Storage();
const bucketName = 'ollo-videos';

interface RequestBody {
  audioData: string;  // base64 encoded audio
  subtitles: Array<{ text: string; start: number; end: number; }>;
  format: string;
  filename: string;
}

async function getAudioDuration(base64Audio: Buffer): Promise<number> {
  // Write audio to temp file
  const tmpDir = os.tmpdir();
  const audioPath = path.join(tmpDir, 'temp.mp3');
  await fs.promises.writeFile(audioPath, base64Audio);

  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    // Use ffprobe to get duration
    exec(`ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`, async (error: any, stdout: string) => {
      await fs.promises.unlink(audioPath); // Clean up temp file
      if (error) {
        reject(error);
      } else {
        resolve(parseFloat(stdout.trim()));
      }
    });
  });
}

functions.http('render-video', async (req, res) => {
  try {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    // Validate request
    const body = req.body as RequestBody;
    if (!body.audioData || !body.subtitles || !body.format) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    console.log('Starting video creation process');

    // Get audio duration
    console.log('Getting audio duration');
    const audioBuffer = Buffer.from(body.audioData, 'base64');
    const durationInSeconds = await getAudioDuration(audioBuffer);
    console.log('Audio duration:', durationInSeconds, 'seconds');

    // Create temporary directory for output
    const tmpDir = os.tmpdir();
    const workDir = await fs.promises.mkdtemp(path.join(tmpDir, 'video-'));

    // Bundle the video composition
    console.log('Bundling video composition');
    const bundled = await bundle({
      entryPoint: path.join(__dirname, './remotion/root.tsx'),
      webpackOverride: (config) => config,
    });

    // Calculate frames based on composition FPS
    const compositionId = body.format === 'landscape' ? 'video-landscape' : 
                         body.format === 'portrait' ? 'video-portrait' : 
                         'video-square';
    const fps = body.format === 'landscape' ? 30 : 24;
    const durationInFrames = Math.ceil(durationInSeconds * fps);
    console.log('Duration in frames:', durationInFrames);

    // Select composition
    console.log('Selecting composition');
    const selectedComposition = await selectComposition({
      serveUrl: bundled,
      id: compositionId,
      inputProps: {
        audioData: body.audioData,
        subtitles: body.subtitles,
      },
    });

    // Create a new composition config with the correct duration
    const compositionWithDuration = {
      ...selectedComposition,
      durationInFrames,
      fps,
    };

    // Render video
    console.log('Starting video render');
    const outputPath = path.join(workDir, 'output.mp4');
    await renderMedia({
      composition: compositionWithDuration,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        audioData: body.audioData,
        subtitles: body.subtitles,
      },
    });

    // Upload to Cloud Storage
    console.log('Uploading to Cloud Storage');
    const filename = `${Date.now()}_${path.basename(body.filename, '.mp3')}.mp4`;
    const bucket = storage.bucket(bucketName);
    await bucket.upload(outputPath, {
      destination: filename,
      metadata: {
        contentType: 'video/mp4',
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make the file publicly accessible
    const file = bucket.file(filename);
    await file.makePublic();

    // Clean up
    await fs.promises.rm(workDir, { recursive: true, force: true });

    // Return the public URL
    const videoUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
    console.log('Video creation complete:', videoUrl);
    res.json({ videoUrl });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create video'
    });
  }
});
