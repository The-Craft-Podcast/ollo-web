import { Config } from "@remotion/cli/config";

// Configure Remotion for client-side rendering
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Set reasonable defaults for web rendering
Config.setConcurrency(2);
Config.setQuality(80);
