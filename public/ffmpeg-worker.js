// FFmpeg Worker
self.onmessage = ({ data: { type, id, data } }) => {
  switch (type) {
    case 'run': {
      self.postMessage({ type: 'done', id, data: null });
      break;
    }
    default:
      break;
  }
};