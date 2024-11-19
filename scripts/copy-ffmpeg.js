const fs = require('fs');
const path = require('path');

// Paths to FFmpeg files (updated paths)
const ffmpegCore = path.resolve(__dirname, '../node_modules/@ffmpeg/core/ffmpeg-core.js');
const ffmpegCoreWasm = path.resolve(__dirname, '../node_modules/@ffmpeg/core/ffmpeg-core.wasm');
const ffmpegWorker = path.resolve(__dirname, '../node_modules/@ffmpeg/core/ffmpeg-worker.js');

// Destination paths
const publicDir = path.resolve(__dirname, '../public');
const destCore = path.resolve(publicDir, 'ffmpeg-core.js');
const destWasm = path.resolve(publicDir, 'ffmpeg-core.wasm');
const destWorker = path.resolve(publicDir, 'ffmpeg-worker.js');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Copy files
try {
    if (fs.existsSync(ffmpegCore)) {
        fs.copyFileSync(ffmpegCore, destCore);
        console.log('✅ Copied ffmpeg-core.js');
    } else {
        console.log('⚠️ ffmpeg-core.js not found');
    }
    
    if (fs.existsSync(ffmpegCoreWasm)) {
        fs.copyFileSync(ffmpegCoreWasm, destWasm);
        console.log('✅ Copied ffmpeg-core.wasm');
    } else {
        console.log('⚠️ ffmpeg-core.wasm not found');
    }
    
    if (fs.existsSync(ffmpegWorker)) {
        fs.copyFileSync(ffmpegWorker, destWorker);
        console.log('✅ Copied ffmpeg-worker.js');
    } else {
        console.log('⚠️ ffmpeg-worker.js not found');
    }
} catch (error) {
    console.error('Error copying FFmpeg files:', error);
    process.exit(1);
}
