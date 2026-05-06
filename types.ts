
export interface LyricSegment {
  text: string;
  startTime: number; // in seconds
  endTime: number;
}

export type TransitionType = 'fade' | 'zoom-in' | 'zoom-out' | 'slide-left' | 'slide-right' | 'blur';
export type MediaType = 'image' | 'video';

export interface ReelMedia {
  url: string;
  type: MediaType;
  duration: number;
  transition: TransitionType;
  originalDuration?: number;
  audioEnabled: boolean; // toggle video audio
  volume: number;       // video audio volume (0-1)
  trimStart?: number;   // start time in seconds
  trimEnd?: number;     // end time in seconds
  scale: number;        // 1.0 is default
  offsetY: number;      // vertical offset in pixels
}

export interface Sticker {
  id: string;
  url: string;
  x: number; // 0-100
  y: number; // 0-100
  width: number; // in pixels
  height: number; // in pixels
  rotation: number; // in degrees
  opacity: number; // 0-1
}

export interface VolumeHighlight {
  id: string;
  start: number;
  end: number;
  volume: number; // Multiplier, e.g., 1.5 for 150%, 0 for mute
}

export type LyricAnimation = 'none' | 'fade' | 'slide-up' | 'scale' | 'typewriter' | 'glow-pulse' | 'float' | 'bounce' | 'rotate';

export interface LyricStyle {
  fontFamily: string;
  fontSize: number;
  lineGap: number;
  color: string;
  animation: LyricAnimation;
  verticalPosition: number; // 0 to 100 (percentage from top)
  textAlign: 'left' | 'center' | 'right';
  shadow: boolean;
  glowColor: string;
  glowIntensity: number;
  gradient: boolean;
  gradientColors: [string, string];
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export interface ReelState {
  images: ReelMedia[];
  logo: string | null;
  logoPosition: { x: number; y: number; size: number };
  audioUrl: string | null;
  audioName: string | null;
  audioDuration: number;
  audioTrim: {
    start: number;
    end: number;
  };
  musicVolume: number; // Global background music base volume
  musicEnabled: boolean; // Global toggle for background music
  musicPlaybackRate: number; // Speed of music playback
  vocalIsolationEnabled: boolean; // New: Filter instruments to keep only singer
  musicHighlights: VolumeHighlight[]; // sections to boost/mute music
  lyrics: LyricSegment[];
  lyricStyle: LyricStyle;
  watermark: {
    text: string;
    color: string;
    size: number;
    opacity: number;
    x: number; // 0 to 100
    y: number; // 0 to 100
    textAlign: 'left' | 'center' | 'right';
  };
  songTitle: string;
  stickers: Sticker[];
}

export interface ExportStatus {
  progress: number;
  status: 'idle' | 'generating' | 'completed' | 'error';
  message: string;
}
