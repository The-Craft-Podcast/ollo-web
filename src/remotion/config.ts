export const VideoFormats = {
  LANDSCAPE: {
    name: 'landscape',
    width: 1920,
    height: 1080,
    fps: 30,
  },
  PORTRAIT: {
    name: 'portrait',
    width: 1080,
    height: 1920,
    fps: 30,
  },
  SQUARE: {
    name: 'square',
    width: 1080,
    height: 1080,
    fps: 30,
  },
} as const;
