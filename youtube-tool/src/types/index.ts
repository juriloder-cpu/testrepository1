// Type exports from database schema
export type Project = {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'scripting' | 'generating_tts' | 'generating_images' | 'ready' | 'rendering' | 'complete' | 'error';
  targetDuration: number | null;
  aspectRatio: string | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Script = {
  id: string;
  projectId: string;
  fullText: string;
  generationPrompt: string | null;
  wordCount: number | null;
  estimatedDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Segment = {
  id: string;
  projectId: string;
  scriptId: string;
  segmentOrder: number;
  text: string;
  segmentType: 'intro' | 'section' | 'transition' | 'outro' | 'custom';
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
  selectedImageId: string | null;
  imageEffect: 'none' | 'ken_burns_in' | 'ken_burns_out' | 'fade' | 'pan_left' | 'pan_right';
  createdAt: Date;
};

export type TTSResult = {
  id: string;
  projectId: string;
  audioFilePath: string | null;
  audioFormat: string | null;
  durationSeconds: number | null;
  subtitleData: any;
  voiceId: string | null;
  voiceSettings: any;
  createdAt: Date;
};

export type Image = {
  id: string;
  segmentId: string;
  filePath: string;
  fileName: string;
  width: number | null;
  height: number | null;
  prompt: string | null;
  negativePrompt: string | null;
  generationSettings: any;
  characterIds: any;
  isSelected: boolean;
  createdAt: Date;
};

export type Character = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  referenceImagePaths: any;
  stylePrompt: string | null;
  faceEmbedding: Buffer | null;
  isGlobal: boolean;
  createdAt: Date;
};

export type SubtitlePreset = {
  id: string;
  name: string;
  isDefault: boolean;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  primaryColor: string;
  secondaryColor: string;
  outlineColor: string;
  backgroundColor: string;
  highlightColor: string;
  dimColor: string;
  enableHighlight: boolean;
  outlineWidth: number;
  shadowDepth: number;
  alignment: number;
  marginLeft: number;
  marginRight: number;
  marginVertical: number;
  fadeIn: number;
  fadeOut: number;
  createdAt: Date;
};

export type Overlay = {
  id: string;
  projectId: string | null;
  name: string;
  type: 'logo' | 'watermark' | 'lower_third' | 'subscribe' | 'custom';
  filePath: string;
  isVideo: boolean;
  positionX: string;
  positionY: string;
  scale: number;
  showTimes: any;
  isGlobal: boolean;
  createdAt: Date;
};

export type Render = {
  id: string;
  projectId: string;
  status: 'queued' | 'preparing' | 'rendering' | 'encoding' | 'complete' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string | null;
  outputPath: string | null;
  outputFormat: string;
  fileSizeBytes: number | null;
  renderSettings: any;
  subtitlePresetId: string | null;
  errorMessage: string | null;
  errorDetails: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export type AppSettings = {
  id: string;
  claudeApiKey: string | null;
  ttsApiKey: string | null;
  ttsApiUrl: string | null;
  imageApiKey: string | null;
  imageApiUrl: string | null;
  defaultVoiceId: string | null;
  defaultImageModel: string | null;
  defaultSubtitlePresetId: string | null;
  ffmpegPath: string;
  outputDirectory: string;
  useGpuEncoding: boolean;
  gpuEncoder: string;
  updatedAt: Date;
};

// Service-specific types
export interface ScriptSegment {
  type: 'intro' | 'section' | 'transition' | 'outro';
  text: string;
  estimatedDuration?: number;
}

export interface GenerateScriptOptions {
  projectId: string;
  prompt: string;
  targetDuration?: number;
  style?: 'educational' | 'entertainment' | 'documentary' | 'storytelling';
  includeSegmentMarkers?: boolean;
}

export interface TTSOptions {
  voiceId: string;
  speed?: number;
  pitch?: number;
}

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface RenderSettings {
  resolution: { width: number; height: number };
  fps: number;
  videoBitrate: string;
  audioBitrate: string;
  codec: 'libx264' | 'h264_nvenc' | 'h264_amf' | 'h264_videotoolbox';
  preset: 'ultrafast' | 'fast' | 'medium' | 'slow';
  crf: number;
}
