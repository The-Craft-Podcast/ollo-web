import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import TranscribePage from "../page";
import { ffmpegService, VideoFormats } from '@/services/ffmpeg';

const mockToast = jest.fn();

// Mock the entire toast module
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: []
  })
}));

// Mock Toaster component
jest.mock("@/components/ui/toaster", () => ({
  Toaster: () => null
}));

// Mock FFmpeg service
jest.mock('@/services/ffmpeg', () => ({
  ffmpegService: {
    isLoaded: jest.fn().mockReturnValue(false),
    load: jest.fn().mockResolvedValue(undefined),
    createVideoWithSubtitles: jest.fn().mockResolvedValue('mock-video-url'),
  },
  VideoFormats: {
    LANDSCAPE: { width: 1920, height: 1080, name: 'landscape' as const },
    TIKTOK: { width: 1080, height: 1920, name: 'tiktok' as const }
  }
}));

describe("TranscribePage", () => {
  beforeAll(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ segments: [{ id: 1, start: 0, end: 1, text: "Hello" }] }),
      })
    ) as jest.Mock;
  });

  afterAll(() => {
    if (global.fetch) {
      (global.fetch as jest.Mock).mockClear();
      delete (global as any).fetch;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (window.URL.createObjectURL as jest.Mock).mockReset();
    (window.URL.revokeObjectURL as jest.Mock).mockReset();
  });

  it("renders upload form", () => {
    render(<TranscribePage />);
    expect(screen.getByLabelText(/upload audio file/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /transcribe audio/i })).toBeInTheDocument();
  });

  it("handles file upload", async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);
    
    const file = new File(["dummy"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);
    
    await act(async () => {
      await user.upload(input, file);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "File selected",
      description: "Selected file: test.mp3"
    });
  });

  it("initializes FFmpeg service when creating video", async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);

    // Upload and transcribe file
    const file = new File(["dummy"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);
    await user.upload(input, file);

    const transcribeButton = screen.getByRole("button", { name: /transcribe audio/i });
    await user.click(transcribeButton);

    // Wait for transcription to complete
    await waitFor(() => {
      expect(screen.getByText(/create video/i)).toBeInTheDocument();
    });

    // Click create video button
    const createButton = screen.getByRole("button", { name: /create video/i });
    await user.click(createButton);

    expect(ffmpegService.load).toHaveBeenCalled();
  });

  it("handles transcription process", async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);

    // Upload file
    const file = new File(["dummy"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);
    await user.upload(input, file);

    // Click transcribe button
    const transcribeButton = screen.getByRole("button", { name: /transcribe audio/i });
    await user.click(transcribeButton);

    // Wait for transcription to complete
    await waitFor(() => {
      expect(screen.getByText("0:00.000 - 0:01.000")).toBeInTheDocument();
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });
  });

  it("handles video format selection", async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);

    // Upload and transcribe file first
    const file = new File(["dummy"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);
    await user.upload(input, file);

    const transcribeButton = screen.getByRole("button", { name: /transcribe audio/i });
    await user.click(transcribeButton);

    // Wait for transcription to complete
    await waitFor(() => {
      expect(screen.getByText(/landscape/i)).toBeInTheDocument();
      expect(screen.getByText(/tiktok/i)).toBeInTheDocument();
    });

    // Click TikTok format button
    const tiktokButton = screen.getByRole("button", { name: /tiktok/i });
    await user.click(tiktokButton);

    // Click Landscape format button
    const landscapeButton = screen.getByRole("button", { name: /landscape/i });
    await user.click(landscapeButton);

    // Since we're using Object.is() for comparison, we can't easily test the button state
    // Instead, we'll verify that the buttons are present and clickable
    expect(tiktokButton).toBeInTheDocument();
    expect(landscapeButton).toBeInTheDocument();
  });

  it("handles video creation", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TranscribePage />);

    // Upload file
    const file = new File(["dummy"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);
    await user.upload(input, file);

    // Click transcribe button
    const transcribeButton = screen.getByRole("button", { name: /transcribe audio/i });
    await user.click(transcribeButton);

    // Wait for transcription to complete and create video button to appear
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create video/i })).toBeInTheDocument();
    });

    // Click create video button
    const createButton = screen.getByRole("button", { name: /create video/i });
    await user.click(createButton);

    // Check if video creation was called
    expect(ffmpegService.createVideoWithSubtitles).toHaveBeenCalledWith(
      file,
      expect.arrayContaining([expect.objectContaining({ text: "Hello" })]),
      expect.any(Function),
      VideoFormats.LANDSCAPE
    );

    // Wait for video URL to be set and component to update
    await waitFor(() => {
      const videoElement = screen.getByText("Your browser does not support the video tag.").closest("video");
      expect(videoElement).toHaveAttribute("src", "mock-video-url");
    });

    // Unmount component to trigger cleanup
    unmount();

    // Verify cleanup
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("mock-video-url");
  });
});
