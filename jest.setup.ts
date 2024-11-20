import '@testing-library/jest-dom';

// Mock URL methods
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock TextEncoder
global.TextEncoder = class {
  encode(str: string) {
    return new Uint8Array([...str].map(c => c.charCodeAt(0)));
  }
};
