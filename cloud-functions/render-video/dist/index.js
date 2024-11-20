"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __importStar(require("@google-cloud/functions-framework"));
const storage_1 = require("@google-cloud/storage");
const bundler_1 = require("@remotion/bundler");
const renderer_1 = require("@remotion/renderer");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const storage = new storage_1.Storage();
const bucketName = 'ollo-videos';
async function getAudioDuration(base64Audio) {
    // Write audio to temp file
    const tmpDir = os_1.default.tmpdir();
    const audioPath = path_1.default.join(tmpDir, 'temp.mp3');
    await fs_1.default.promises.writeFile(audioPath, base64Audio);
    return new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        // Use ffprobe to get duration
        exec(`ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`, async (error, stdout) => {
            await fs_1.default.promises.unlink(audioPath); // Clean up temp file
            if (error) {
                reject(error);
            }
            else {
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
        const body = req.body;
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
        const tmpDir = os_1.default.tmpdir();
        const workDir = await fs_1.default.promises.mkdtemp(path_1.default.join(tmpDir, 'video-'));
        // Bundle the video composition
        console.log('Bundling video composition');
        const bundled = await (0, bundler_1.bundle)({
            entryPoint: path_1.default.join(__dirname, './remotion/root.tsx'),
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
        const selectedComposition = await (0, renderer_1.selectComposition)({
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
        const outputPath = path_1.default.join(workDir, 'output.mp4');
        await (0, renderer_1.renderMedia)({
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
        const filename = `${Date.now()}_${path_1.default.basename(body.filename, '.mp3')}.mp4`;
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
        await fs_1.default.promises.rm(workDir, { recursive: true, force: true });
        // Return the public URL
        const videoUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
        console.log('Video creation complete:', videoUrl);
        res.json({ videoUrl });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create video'
        });
    }
});
