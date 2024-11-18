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
jest.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: jest.fn()
}));

describe("TranscribePage", () => {
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
});
