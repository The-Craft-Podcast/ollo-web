import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TranscribePage from '../page';
import { mockFile } from '@/lib/test-utils';

// Mock the remotion service
jest.mock('@/remotion/service', () => ({
  remotionService: {
    createVideo: jest.fn().mockResolvedValue('mock-video-url'),
  },
}));

// Mock the transcribe API
jest.mock('@/app/api/transcribe/route', () => ({
  POST: jest.fn().mockResolvedValue({
    json: () => Promise.resolve({
      segments: [
        { id: 1, start: 0, end: 2, text: 'Hello' },
        { id: 2, start: 2, end: 4, text: 'World' }
      ]
    })
  })
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock the Toaster component
jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => null,
}));

describe('TranscribePage', () => {
  const mockTranscriptResponse = {
    segments: [
      { id: 1, start: 0, end: 2, text: 'Hello' },
      { id: 2, start: 2, end: 4, text: 'World' },
    ],
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    URL.createObjectURL = jest.fn().mockReturnValue('mock-object-url');
    URL.revokeObjectURL = jest.fn();
  });

  it('renders upload form', () => {
    render(<TranscribePage />);
    expect(screen.getByLabelText(/upload audio file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transcribe audio/i })).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);

    const input = screen.getByLabelText(/upload audio file/i);
    await user.upload(input, mockFile);

    expect(screen.getByText(/test\.mp3/i)).toBeInTheDocument();
  });

  it('handles transcription process', async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);

    // Upload file
    const input = screen.getByLabelText(/upload audio file/i);
    await user.upload(input, mockFile);

    // Click transcribe button
    const transcribeButton = screen.getByRole('button', { name: /transcribe audio/i });
    await user.click(transcribeButton);

    // Wait for transcription to complete
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('World')).toBeInTheDocument();
    });
  });

  it('creates video with subtitles when button is clicked', async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);

    // Upload file and transcribe
    const input = screen.getByLabelText(/upload audio file/i);
    await user.upload(input, mockFile);

    // Click transcribe button
    const transcribeButton = screen.getByRole('button', { name: /transcribe audio/i });
    await user.click(transcribeButton);

    // Wait for transcription to complete
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Click create video button
    const createVideoButton = screen.getByRole('button', { name: /create video/i });
    await user.click(createVideoButton);

    // Verify that the video creation was called with correct parameters
    await waitFor(() => {
      expect(remotionService.createVideo).toHaveBeenCalledWith(
        expect.any(String), // backgroundImageUrl
        expect.any(String), // audioUrl
        mockTranscriptResponse.segments.map(segment => ({
          text: segment.text,
          start: segment.start,
          end: segment.end,
        })),
        'landscape' // default format
      );
    });

    // Verify that the video URL is set
    expect(screen.getByRole('video')).toHaveAttribute('src', 'mock-video-url');
  });

  it('handles video format selection', async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);

    // Upload file and transcribe
    const input = screen.getByLabelText(/upload audio file/i);
    await user.upload(input, mockFile);

    // Click transcribe button
    const transcribeButton = screen.getByRole('button', { name: /transcribe audio/i });
    await user.click(transcribeButton);

    // Wait for transcription to complete
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Click format buttons and verify they change the format
    const portraitButton = screen.getByRole('button', { name: /portrait/i });
    const landscapeButton = screen.getByRole('button', { name: /landscape/i });
    const squareButton = screen.getByRole('button', { name: /square/i });

    // Initially landscape should be selected
    expect(landscapeButton).toHaveClass('bg-primary');
    expect(portraitButton).toHaveClass('bg-background');
    expect(squareButton).toHaveClass('bg-background');

    await user.click(portraitButton);
    expect(portraitButton).toHaveClass('bg-primary');
    expect(landscapeButton).toHaveClass('bg-background');
    expect(squareButton).toHaveClass('bg-background');

    await user.click(squareButton);
    expect(portraitButton).toHaveClass('bg-background');
    expect(landscapeButton).toHaveClass('bg-background');
    expect(squareButton).toHaveClass('bg-primary');
  });
});
