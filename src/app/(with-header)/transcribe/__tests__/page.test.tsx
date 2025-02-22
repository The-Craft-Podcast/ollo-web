import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import TranscribePage from "../page";

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

// Mock FFmpeg
jest.mock('@ffmpeg/ffmpeg', () => {
  return {
    FFmpeg: jest.fn(() => ({
      load: jest.fn(),
      loaded: false,
      on: jest.fn(),
      writeFile: jest.fn(),
    })),
  };
});

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
    global.fetch.mockClear();
    delete global.fetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

  it("initializes FFmpeg", async () => {
    const { FFmpeg } = require('@ffmpeg/ffmpeg');
    render(<TranscribePage />);
    await act(async () => {
      // Wait for the useEffect to run
    });
    expect(FFmpeg).toHaveBeenCalled();
  });

  it("loads FFmpeg successfully", async () => {
    const mockFFmpegLoad = jest.fn().mockResolvedValueOnce(true);
    (FFmpeg as jest.Mock).mockImplementationOnce(() => ({
      load: mockFFmpegLoad,
      loaded: false,
      on: jest.fn(),
    }));

    await act(async () => {
      render(<TranscribePage />);
    });

    expect(mockFFmpegLoad).toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: "Error",
    }));
  });

  it("handles FFmpeg load error", async () => {
    const mockFFmpegLoad = jest.fn().mockRejectedValueOnce(new Error("Failed to load"));
    (FFmpeg as jest.Mock).mockImplementationOnce(() => ({
      load: mockFFmpegLoad,
      loaded: false,
      on: jest.fn(),
    }));

    await act(async () => {
      render(<TranscribePage />);
    });

    expect(mockFFmpegLoad).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Error",
      description: "Failed to load FFmpeg core",
    }));
  });

  it("handles transcription process", async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);
    const file = new File(["dummy"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);
    await act(async () => {
      await user.upload(input, file);
    });

    // Wait for the transcription to complete
    await screen.findByText(/Hello/);

    const transcriptText = screen.getByText(/Hello/);
    expect(transcriptText).toBeInTheDocument();
  });
});
