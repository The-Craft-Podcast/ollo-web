import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TranscribePage from "../page";
import { useToast } from "@/hooks/use-toast";

// Mock the useToast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

// Mock the Toaster component
jest.mock("@/components/ui/toaster", () => ({
  Toaster: () => null,
}));

describe("TranscribePage", () => {
  const mockToast = jest.fn();
  const mockWriteText = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the upload form", () => {
    render(<TranscribePage />);
    expect(screen.getByLabelText(/upload audio file/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /transcribe audio/i })).toBeInTheDocument();
  });

  it("handles file selection", async () => {
    const user = userEvent.setup();
    render(<TranscribePage />);
    
    const file = new File(["dummy content"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);

    await act(async () => {
      await user.upload(input, file);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "File selected",
      description: "Selected file: test.mp3",
    });
  });

  it("shows loading state during transcription", async () => {
    const user = userEvent.setup();
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ segments: [] }),
      }), 100))
    );

    render(<TranscribePage />);
    
    const file = new File(["dummy content"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);

    await act(async () => {
      await user.upload(input, file);
      await user.click(screen.getByRole("button", { name: /transcribe audio/i }));
    });

    expect(await screen.findByText(/transcribing/i)).toBeInTheDocument();
  });

  it("handles successful transcription", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      segments: [
        {
          start_time: 0.0,
          end_time: 5.0,
          speaker: "SPEAKER_00",
          text: "Hello world",
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<TranscribePage />);
    
    const file = new File(["dummy content"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);

    await act(async () => {
      await user.upload(input, file);
      await user.click(screen.getByRole("button", { name: /transcribe audio/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
      expect(screen.getByText("SPEAKER_00")).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Success",
        description: "Audio transcribed successfully!",
      });
    });
  });

  it("handles transcription error", async () => {
    const user = userEvent.setup();
    const errorMessage = "Failed to transcribe audio";
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: errorMessage }),
    });

    render(<TranscribePage />);
    
    const file = new File(["dummy content"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);

    await act(async () => {
      await user.upload(input, file);
      await user.click(screen.getByRole("button", { name: /transcribe audio/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    });
  });

  it("handles copy to clipboard", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      segments: [
        {
          start_time: 0.0,
          end_time: 5.0,
          speaker: "SPEAKER_00",
          text: "Hello world",
        },
      ],
    };

    // Set up clipboard mock
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<TranscribePage />);
    
    const file = new File(["dummy content"], "test.mp3", { type: "audio/mpeg" });
    const input = screen.getByLabelText(/upload audio file/i);

    await act(async () => {
      await user.upload(input, file);
      await user.click(screen.getByRole("button", { name: /transcribe audio/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    const copyButton = await screen.findByRole("button", { name: /copy/i });
    
    await act(async () => {
      await user.click(copyButton);
    });

    const expectedText =
      "Start time: 0.000\n" +
      "End time: 5.000\n" +
      "Speaker: SPEAKER_00\n" +
      "Text: Hello world\n";

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(expectedText);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Success",
        description: "Transcript copied to clipboard",
      });
    });
  });
});
