"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoComposition = void 0;
const react_1 = __importStar(require("react"));
const remotion_1 = require("remotion");
const VideoComposition = ({ audioData, subtitles }) => {
    const frame = (0, remotion_1.useCurrentFrame)();
    const { fps } = (0, remotion_1.useVideoConfig)();
    const [handle] = (0, react_1.useState)(() => (0, remotion_1.delayRender)());
    const audioUrl = `data:audio/mp3;base64,${audioData}`;
    (0, react_1.useEffect)(() => {
        const audioElement = document.createElement('audio');
        audioElement.src = audioUrl;
        audioElement.addEventListener('loadedmetadata', () => {
            (0, remotion_1.continueRender)(handle);
        });
        audioElement.addEventListener('error', () => {
            console.error('Error loading audio:', audioElement.error);
            (0, remotion_1.continueRender)(handle);
        });
    }, [audioUrl, handle]);
    const currentTime = frame / fps;
    const currentSubtitle = subtitles.find((sub) => currentTime >= sub.start && currentTime <= sub.end);
    return (react_1.default.createElement(remotion_1.AbsoluteFill, { style: { backgroundColor: 'black' } },
        react_1.default.createElement(remotion_1.Audio, { src: audioUrl }),
        currentSubtitle && (react_1.default.createElement("div", { style: {
                position: 'absolute',
                bottom: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: '10px 20px',
                borderRadius: '5px',
                maxWidth: '80%',
                textAlign: 'center',
            } },
            react_1.default.createElement("p", { style: {
                    color: 'white',
                    fontSize: '24px',
                    margin: 0,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                } }, currentSubtitle.text)))));
};
exports.VideoComposition = VideoComposition;
