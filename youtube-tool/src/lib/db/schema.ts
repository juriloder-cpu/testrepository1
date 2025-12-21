import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ============================================
// PROJECTS
// ============================================

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['draft', 'scripting', 'generating_tts', 'generating_images', 'ready', 'rendering', 'complete', 'error']
  }).default('draft').notNull(),

  // Settings
  targetDuration: integer('target_duration'), // in seconds
  aspectRatio: text('aspect_ratio').default('16:9'),
  resolution: text('resolution').default('1920x1080'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  script: one(scripts),
  ttsResult: one(ttsResults),
  segments: many(segments),
  characters: many(characters),
  renders: many(renders),
}));

// ============================================
// SCRIPTS
// ============================================

export const scripts = sqliteTable('scripts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

  fullText: text('full_text').notNull(),
  generationPrompt: text('generation_prompt'), // The prompt used to generate this script
  wordCount: integer('word_count'),
  estimatedDuration: integer('estimated_duration'), // in seconds

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  project: one(projects, {
    fields: [scripts.projectId],
    references: [projects.id],
  }),
  segments: many(segments),
}));

// ============================================
// SEGMENTS (Core linking unit)
// ============================================

export const segments = sqliteTable('segments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  scriptId: text('script_id').references(() => scripts.id, { onDelete: 'cascade' }).notNull(),

  // Content
  segmentOrder: integer('segment_order').notNull(),
  text: text('text').notNull(),
  segmentType: text('segment_type', {
    enum: ['intro', 'section', 'transition', 'outro', 'custom']
  }).default('section'),

  // Timing (filled after TTS generation)
  startTime: real('start_time'), // in seconds
  endTime: real('end_time'),
  duration: real('duration'),

  // Selected image for this segment
  selectedImageId: text('selected_image_id'),

  // Image display settings
  imageEffect: text('image_effect', {
    enum: ['none', 'ken_burns_in', 'ken_burns_out', 'fade', 'pan_left', 'pan_right']
  }).default('ken_burns_in'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const segmentsRelations = relations(segments, ({ one, many }) => ({
  project: one(projects, {
    fields: [segments.projectId],
    references: [projects.id],
  }),
  script: one(scripts, {
    fields: [segments.scriptId],
    references: [scripts.id],
  }),
  selectedImage: one(images, {
    fields: [segments.selectedImageId],
    references: [images.id],
  }),
  images: many(images),
}));

// ============================================
// TTS RESULTS
// ============================================

export const ttsResults = sqliteTable('tts_results', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

  // Audio file
  audioFilePath: text('audio_file_path'),
  audioFormat: text('audio_format').default('mp3'),
  durationSeconds: real('duration_seconds'),

  // Raw subtitle/timing data from TTS API
  subtitleData: text('subtitle_data', { mode: 'json' }), // Store raw API response

  // TTS settings used
  voiceId: text('voice_id'),
  voiceSettings: text('voice_settings', { mode: 'json' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const ttsResultsRelations = relations(ttsResults, ({ one }) => ({
  project: one(projects, {
    fields: [ttsResults.projectId],
    references: [projects.id],
  }),
}));

// ============================================
// IMAGES
// ============================================

export const images = sqliteTable('images', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  segmentId: text('segment_id').references(() => segments.id, { onDelete: 'cascade' }).notNull(),

  // File info
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  width: integer('width'),
  height: integer('height'),

  // Generation info
  prompt: text('prompt'),
  negativePrompt: text('negative_prompt'),
  generationSettings: text('generation_settings', { mode: 'json' }), // model, seed, steps, etc.

  // Character references used
  characterIds: text('character_ids', { mode: 'json' }), // Array of character IDs

  // Selection
  isSelected: integer('is_selected', { mode: 'boolean' }).default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const imagesRelations = relations(images, ({ one }) => ({
  segment: one(segments, {
    fields: [images.segmentId],
    references: [segments.id],
  }),
}));

// ============================================
// CHARACTER PROFILES (for consistent image generation)
// ============================================

export const characters = sqliteTable('characters', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

  name: text('name').notNull(),
  description: text('description'), // Physical description

  // Reference images for consistency
  referenceImagePaths: text('reference_image_paths', { mode: 'json' }), // Array of paths

  // Style prompt to inject into all generations featuring this character
  stylePrompt: text('style_prompt'),

  // For IP-Adapter / ControlNet style references
  faceEmbedding: blob('face_embedding'), // Optional: store face embedding

  isGlobal: integer('is_global', { mode: 'boolean' }).default(false), // If true, available across all projects

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const charactersRelations = relations(characters, ({ one }) => ({
  project: one(projects, {
    fields: [characters.projectId],
    references: [projects.id],
  }),
}));

// ============================================
// SUBTITLE PRESETS
// ============================================

export const subtitlePresets = sqliteTable('subtitle_presets', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  name: text('name').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),

  // Font settings
  fontFamily: text('font_family').default('Arial'),
  fontSize: integer('font_size').default(48),
  fontWeight: text('font_weight').default('bold'),

  // Colors (in BGR format for ASS, store as hex)
  primaryColor: text('primary_color').default('FFFFFF'),
  secondaryColor: text('secondary_color').default('FFFFFF'),
  outlineColor: text('outline_color').default('000000'),
  backgroundColor: text('background_color').default('00000000'), // Transparent by default

  // Word highlight settings (for karaoke effect)
  highlightColor: text('highlight_color').default('00FFFF'), // Yellow in BGR
  dimColor: text('dim_color').default('AAAAAA'),
  enableHighlight: integer('enable_highlight', { mode: 'boolean' }).default(false),

  // Styling
  outlineWidth: integer('outline_width').default(3),
  shadowDepth: integer('shadow_depth').default(2),

  // Position
  alignment: integer('alignment').default(2), // 1-9 numpad style, 2 = bottom center
  marginLeft: integer('margin_left').default(30),
  marginRight: integer('margin_right').default(30),
  marginVertical: integer('margin_vertical').default(60),

  // Animation
  fadeIn: integer('fade_in').default(0), // milliseconds
  fadeOut: integer('fade_out').default(0),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ============================================
// OVERLAYS
// ============================================

export const overlays = sqliteTable('overlays', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  type: text('type', {
    enum: ['logo', 'watermark', 'lower_third', 'subscribe', 'custom']
  }).notNull(),

  // File
  filePath: text('file_path').notNull(),
  isVideo: integer('is_video', { mode: 'boolean' }).default(false), // If true, it's an animated overlay

  // Position
  positionX: text('position_x').default('W-w-30'), // FFmpeg expression
  positionY: text('position_y').default('30'),
  scale: integer('scale').default(100), // percentage

  // Timing (null = always visible)
  showTimes: text('show_times', { mode: 'json' }), // Array of { start: number, end: number }

  // Global overlay (available to all projects)
  isGlobal: integer('is_global', { mode: 'boolean' }).default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const overlaysRelations = relations(overlays, ({ one }) => ({
  project: one(projects, {
    fields: [overlays.projectId],
    references: [projects.id],
  }),
}));

// ============================================
// RENDERS
// ============================================

export const renders = sqliteTable('renders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

  status: text('status', {
    enum: ['queued', 'preparing', 'rendering', 'encoding', 'complete', 'failed', 'cancelled']
  }).default('queued').notNull(),

  progress: real('progress').default(0), // 0-100
  currentStep: text('current_step'), // Human readable current step

  // Output
  outputPath: text('output_path'),
  outputFormat: text('output_format').default('mp4'),
  fileSizeBytes: integer('file_size_bytes'),

  // Render settings used
  renderSettings: text('render_settings', { mode: 'json' }),
  subtitlePresetId: text('subtitle_preset_id').references(() => subtitlePresets.id),

  // Error info
  errorMessage: text('error_message'),
  errorDetails: text('error_details'),

  // Timing
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const rendersRelations = relations(renders, ({ one }) => ({
  project: one(projects, {
    fields: [renders.projectId],
    references: [projects.id],
  }),
  subtitlePreset: one(subtitlePresets, {
    fields: [renders.subtitlePresetId],
    references: [subtitlePresets.id],
  }),
}));

// ============================================
// APP SETTINGS (singleton table)
// ============================================

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey().default('default'),

  // API Keys (encrypted in production)
  claudeApiKey: text('claude_api_key'),
  ttsApiKey: text('tts_api_key'),
  ttsApiUrl: text('tts_api_url'),
  imageApiKey: text('image_api_key'),
  imageApiUrl: text('image_api_url'),

  // Default settings
  defaultVoiceId: text('default_voice_id'),
  defaultImageModel: text('default_image_model'),
  defaultSubtitlePresetId: text('default_subtitle_preset_id'),

  // Paths
  ffmpegPath: text('ffmpeg_path').default('ffmpeg'),
  outputDirectory: text('output_directory').default('./data/output'),

  // Render settings
  useGpuEncoding: integer('use_gpu_encoding', { mode: 'boolean' }).default(false),
  gpuEncoder: text('gpu_encoder').default('h264_nvenc'), // or h264_amf, h264_videotoolbox

  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
