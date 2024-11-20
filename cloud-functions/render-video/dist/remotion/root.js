"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const remotion_1 = require("remotion");
const VideoComposition_1 = require("./VideoComposition");
const RemotionRoot = () => {
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(remotion_1.Composition, { id: "video-landscape", component: VideoComposition_1.VideoComposition, durationInFrames: 1, fps: 30, width: 1920, height: 1080, defaultProps: {
                audioData: '',
                subtitles: [],
            } }),
        react_1.default.createElement(remotion_1.Composition, { id: "video-portrait", component: VideoComposition_1.VideoComposition, durationInFrames: 1, fps: 24, width: 1080, height: 1920, defaultProps: {
                audioData: '',
                subtitles: [],
            } }),
        react_1.default.createElement(remotion_1.Composition, { id: "video-square", component: VideoComposition_1.VideoComposition, durationInFrames: 1, fps: 24, width: 1080, height: 1080, defaultProps: {
                audioData: '',
                subtitles: [],
            } })));
};
(0, remotion_1.registerRoot)(RemotionRoot);
exports.default = RemotionRoot;
