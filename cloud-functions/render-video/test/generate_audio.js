const { exec } = require('child_process');
const path = require('path');

const text = `Hello, this is a test subtitle.
Testing video generation.
With Remotion and Cloud Functions.`;

// Use macOS say command to generate audio
const outputPath = path.join(__dirname, 'test.aiff');
const mp3Path = path.join(__dirname, 'test.mp3');

// Generate audio file using say command
exec(`say -o "${outputPath}" "${text}"`, (error) => {
  if (error) {
    console.error('Error generating audio:', error);
    return;
  }
  
  // Convert to mp3 using ffmpeg
  exec(`ffmpeg -i "${outputPath}" -acodec libmp3lame "${mp3Path}"`, (error) => {
    if (error) {
      console.error('Error converting to mp3:', error);
      return;
    }
    console.log('Test audio file created successfully!');
    
    // Clean up the aiff file
    exec(`rm "${outputPath}"`, (error) => {
      if (error) {
        console.error('Error cleaning up:', error);
      }
    });
  });
});
