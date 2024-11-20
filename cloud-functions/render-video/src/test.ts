import fs from 'fs';
import path from 'path';

async function testVideoGeneration() {
  try {
    // Test audio file
    const audioPath = path.join(__dirname, '../test/test.mp3');
    const audioData = await fs.promises.readFile(audioPath, { encoding: 'base64' });

    // Test subtitles
    const subtitles = [
      { text: "Hello, this is a test subtitle", start: 0, end: 2 },
      { text: "Testing video generation", start: 2, end: 4 },
      { text: "With Remotion and Cloud Functions", start: 4, end: 6 }
    ];

    // Make the request
    const response = await fetch('http://localhost:8080', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData,
        subtitles,
        format: 'landscape',
        filename: 'test.mp4'
      }),
    });

    const result = await response.json();
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testVideoGeneration();
