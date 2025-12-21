CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`claude_api_key` text,
	`tts_api_key` text,
	`tts_api_url` text,
	`image_api_key` text,
	`image_api_url` text,
	`default_voice_id` text,
	`default_image_model` text,
	`default_subtitle_preset_id` text,
	`ffmpeg_path` text DEFAULT 'ffmpeg',
	`output_directory` text DEFAULT './data/output',
	`use_gpu_encoding` integer DEFAULT false,
	`gpu_encoder` text DEFAULT 'h264_nvenc',
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`reference_image_paths` text,
	`style_prompt` text,
	`face_embedding` blob,
	`is_global` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`segment_id` text NOT NULL,
	`file_path` text NOT NULL,
	`file_name` text NOT NULL,
	`width` integer,
	`height` integer,
	`prompt` text,
	`negative_prompt` text,
	`generation_settings` text,
	`character_ids` text,
	`is_selected` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`segment_id`) REFERENCES `segments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `overlays` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`file_path` text NOT NULL,
	`is_video` integer DEFAULT false,
	`position_x` text DEFAULT 'W-w-30',
	`position_y` text DEFAULT '30',
	`scale` integer DEFAULT 100,
	`show_times` text,
	`is_global` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`target_duration` integer,
	`aspect_ratio` text DEFAULT '16:9',
	`resolution` text DEFAULT '1920x1080',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `renders` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`progress` real DEFAULT 0,
	`current_step` text,
	`output_path` text,
	`output_format` text DEFAULT 'mp4',
	`file_size_bytes` integer,
	`render_settings` text,
	`subtitle_preset_id` text,
	`error_message` text,
	`error_details` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subtitle_preset_id`) REFERENCES `subtitle_presets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scripts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`full_text` text NOT NULL,
	`generation_prompt` text,
	`word_count` integer,
	`estimated_duration` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `segments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`script_id` text NOT NULL,
	`segment_order` integer NOT NULL,
	`text` text NOT NULL,
	`segment_type` text DEFAULT 'section',
	`start_time` real,
	`end_time` real,
	`duration` real,
	`selected_image_id` text,
	`image_effect` text DEFAULT 'ken_burns_in',
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`script_id`) REFERENCES `scripts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`selected_image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subtitle_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false,
	`font_family` text DEFAULT 'Arial',
	`font_size` integer DEFAULT 48,
	`font_weight` text DEFAULT 'bold',
	`primary_color` text DEFAULT 'FFFFFF',
	`secondary_color` text DEFAULT 'FFFFFF',
	`outline_color` text DEFAULT '000000',
	`background_color` text DEFAULT '00000000',
	`highlight_color` text DEFAULT '00FFFF',
	`dim_color` text DEFAULT 'AAAAAA',
	`enable_highlight` integer DEFAULT false,
	`outline_width` integer DEFAULT 3,
	`shadow_depth` integer DEFAULT 2,
	`alignment` integer DEFAULT 2,
	`margin_left` integer DEFAULT 30,
	`margin_right` integer DEFAULT 30,
	`margin_vertical` integer DEFAULT 60,
	`fade_in` integer DEFAULT 0,
	`fade_out` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `tts_results` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`audio_file_path` text,
	`audio_format` text DEFAULT 'mp3',
	`duration_seconds` real,
	`subtitle_data` text,
	`voice_id` text,
	`voice_settings` text,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
